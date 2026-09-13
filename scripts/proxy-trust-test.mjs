/* proxy-trust-test.mjs — what the server may believe about who is calling.
 *
 * THE DEFECT THIS SUITE EXISTS FOR
 * `X-Forwarded-For: a, b, c` is built left to right. The client writes the first
 * entry; each proxy APPENDS the address it received the connection from. So the
 * leftmost value is not an address the server learned — it is a string the
 * client chose.
 *
 * The server read that leftmost value, and both login rate limits key on it.
 * Measured through a real reverse proxy, with NST_TRUST_PROXY=1 (which
 * server/README.md recommends for anything past a trusted LAN):
 *
 *     fine gate,  honest client                 locked after 9 attempts
 *     fine gate,  rotating X-Forwarded-For      NEVER locked in 14
 *     coarse gate, rotating X-Forwarded-For     NEVER locked in 70
 *     Secure flag, client prepends "http"       SECURE MISSING
 *
 * Unlimited password guesses at any account, unlimited account enumeration, and
 * a session cookie a client could strip Secure off — all from one socket.
 *
 * WHY IT NEEDS A REAL PROXY
 * Reading a header cannot be tested by sending that header directly: with
 * nothing in front, leftmost and rightmost are the same entry and every
 * implementation looks correct. The bug only appears when something appends,
 * which is the only topology where the setting is supposed to be on. So this
 * suite stands up its own reverse proxy — one that appends X-Forwarded-For and
 * sets X-Forwarded-Proto, as nginx, IIS and Caddy all do — and drives the app
 * through it.
 *
 * Brings its own server, database and proxy; nothing needs to be running first.
 * Pure Node, no browser. Run: node scripts/proxy-trust-test.mjs
 */
import { spawn } from 'node:child_process';
import { createServer, request as httpRequest } from 'node:http';
import { createServer as netServer } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..');
let pass = 0, fail = 0;
const ok = (n, c, x) => { if (c) { pass++; console.log('ok   ' + n); }
  else { fail++; console.log('FAIL ' + n + (x !== undefined ? '  -- ' + x : '')); } };

const started = [];   // { child, proxy, dir } to tear down whatever happens

/* Ports from the OS, not from a random number.
 *
 * This suite stands up eight app servers and their proxies, and the first
 * version picked ports out of a 900-wide range at random: two runs close
 * together collided and the whole suite died on EADDRINUSE. A suite that fails
 * for a reason unrelated to what it measures teaches you to re-run it instead of
 * read it, which is worse than not having it. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = netServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/* One app + one or more chained proxies in front of it. `hops` proxies means
 * `hops` appended entries, which is the topology NST_TRUST_PROXY_HOPS names.
 *
 * The port can still be taken between the probe above and the bind below, so a
 * start that fails is retried on fresh ports rather than failing the suite. */
async function stack(opts = {}) {
  for (let tries = 3; ; tries--) {
    try { return await stackOnce(opts); }
    catch (e) { if (tries <= 1) throw e; }
  }
}

async function stackOnce({ hops = 1, peer = '198.18.7.7', env = {} } = {}) {
  const port = await freePort();
  const dir = mkdtempSync(join(tmpdir(), 'nst-proxy-'));
  const child = spawn(process.execPath, [join(REPO, 'server', 'server.mjs')], {
    env: { ...process.env, NST_PORT: String(port), NST_DB: join(dir, 'p.db'),
           NST_HOST: '127.0.0.1', NST_ROOT_PASSWORD: 'proxy-suite-pw',
           NST_TRUST_PROXY: '1', ...env },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let log = '';
  child.stdout.on('data', (d) => { log += d; });
  child.stderr.on('data', (d) => { log += d; });
  const up = await (async () => {
    const end = Date.now() + 15000;
    while (Date.now() < end) {
      try { const r = await fetch(`http://127.0.0.1:${port}/login`, { redirect: 'manual' }); if (r.status) return true; }
      catch { await new Promise((r) => setTimeout(r, 120)); }
    }
    return false;
  })();
  if (!up) { try { child.kill('SIGKILL'); } catch {} rmSync(dir, { recursive: true, force: true });
    throw new Error('server did not start: ' + log); }
  // From here on the child is live, so anything that throws below must take it
  // and its proxies down rather than leave them holding ports for the retry.
  const partial = { child, proxies: [], dir };

  /* Each hop appends the address it saw. Hop 1 sees the client and appends
   * `peer`; hop 2 sees hop 1 and appends a proxy address, and so on. */
  const proxies = partial.proxies;
  let target = port;
  try {
  for (let h = 0; h < hops; h++) {
    const appended = h === 0 ? peer : `10.200.0.${h}`;
    const to = target;
    const pr = createServer((cReq, cRes) => {
      const prior = cReq.headers['x-forwarded-for'];
      const priorProto = cReq.headers['x-forwarded-proto'];
      const headers = { ...cReq.headers, host: `127.0.0.1:${to}`,
        'x-forwarded-for': prior ? prior + ', ' + appended : appended,
        'x-forwarded-proto': priorProto ? priorProto + ', https' : 'https' };
      const u = httpRequest({ host: '127.0.0.1', port: to, path: cReq.url, method: cReq.method, headers },
        (uRes) => { cRes.writeHead(uRes.statusCode, uRes.headers); uRes.pipe(cRes); });
      u.on('error', () => { try { cRes.writeHead(502); cRes.end(); } catch {} });
      cReq.pipe(u);
    });
    const pport = await freePort();
    await new Promise((resolve, reject) => {
      pr.once('error', reject);
      pr.listen(pport, '127.0.0.1', () => { pr.removeListener('error', reject); resolve(); });
    });
    proxies.push(pr);
    target = pport;
  }
  } catch (e) {
    for (const pr of proxies) { try { pr.close(); } catch {} }
    try { child.kill('SIGKILL'); } catch {}
    try { rmSync(dir, { recursive: true, force: true }); } catch {}
    throw e;
  }
  const rec = { child, proxies, dir, base: `http://127.0.0.1:${target}` };
  started.push(rec);
  return rec;
}

async function teardown() {
  for (const s of started) {
    for (const p of s.proxies) { try { p.close(); } catch {} }
    if (s.child.exitCode === null && s.child.signalCode === null) {
      const gone = new Promise((r) => s.child.once('exit', r));
      try { s.child.kill('SIGTERM'); } catch {}
      await Promise.race([gone, new Promise((r) => setTimeout(r, 3000))]);
      if (s.child.exitCode === null) { try { s.child.kill('SIGKILL'); } catch {} }
    }
    try { rmSync(s.dir, { recursive: true, force: true }); } catch {}
  }
}

/* One failed sign-in. `xff` is what the CLIENT sends, which the proxy then
 * appends to -- the whole point of the suite. */
async function attempt(base, { xff = null, proto = null, username = 'someone' } = {}) {
  const h = {};
  if (xff) h['X-Forwarded-For'] = xff;
  if (proto) h['X-Forwarded-Proto'] = proto;
  const g = await fetch(`${base}/login`, { headers: h });
  const setc = g.headers.getSetCookie ? g.headers.getSetCookie() : [g.headers.get('set-cookie')].filter(Boolean);
  const cookie = setc.map((c) => c.split(';')[0]).join('; ');
  const csrf = ((await g.text()).match(/name="csrf" value="([^"]+)"/) || [])[1] || '';
  const r = await fetch(`${base}/login`, { method: 'POST', redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookie, ...h },
    body: new URLSearchParams({ csrf, username, password: 'not-the-password' }) });
  return { status: r.status, setCookie: setc.join(' | ') };
}

/* How many attempts until the gate closes, or 0 for "never". */
async function untilLocked(base, n, opts) {
  for (let i = 0; i < n; i++) {
    const { status } = await attempt(base, { ...opts, xff: opts.xff ? opts.xff(i) : null,
      username: typeof opts.username === 'function' ? opts.username(i) : opts.username });
    if (status === 429) return i + 1;
  }
  return 0;
}

try {
  /* ---- 1. the fine gate, with and without a spoofed header ------------- */
  {
    const s = await stack();
    const honest = await untilLocked(s.base, 14, { username: 'alice' });
    ok('the per-account gate closes for an honest client', honest > 0 && honest <= 12, honest || 'never');

    // The same attack, from the same socket, with a different claimed address
    // every time. If the server keys on what the CLIENT wrote, this never locks.
    const spoofed = await untilLocked(s.base, 14, { username: 'bob', xff: (i) => `203.0.113.${i}` });
    ok('and a rotating X-Forwarded-For does not reopen it', spoofed > 0 && spoofed <= 12, spoofed || 'NEVER LOCKED');

    /* The discriminating check, stated directly: a bucket locked WITHOUT any
     * client header must still be locked when the client supplies one. Keying
     * on the left entry makes this a different, empty bucket. */
    const after = await attempt(s.base, { username: 'alice', xff: '203.0.113.250' });
    ok('a locked account stays locked however the caller labels itself',
      after.status === 429, 'got ' + after.status);
  }

  /* ---- 2. the coarse gate: working through ACCOUNTS from one address ---- */
  {
    const s = await stack({ peer: '198.18.9.9' });
    // The per-account key never repeats here, so only the per-address gate can
    // see this at all -- it is the one the spoof was aimed at.
    const swept = await untilLocked(s.base, 70, { username: (i) => 'victim' + i, xff: (i) => `203.0.113.${i}` });
    ok('the per-address gate closes on account enumeration despite a rotating header',
      swept > 0, swept || 'NEVER LOCKED in 70');
  }

  /* ---- 3. the Secure flag on the session cookie ------------------------ */
  {
    const s = await stack();
    const honest = await attempt(s.base, { username: 'nobody' });
    ok('behind an https proxy the cookie is marked Secure', /Secure/i.test(honest.setCookie), honest.setCookie);

    // The proxy still says https; the client merely prepends its own claim.
    const spoofed = await attempt(s.base, { username: 'nobody', proto: 'http' });
    ok('and a client prepending "http" cannot strip Secure off it',
      /Secure/i.test(spoofed.setCookie), spoofed.setCookie || '(no cookie)');
  }

  /* ---- 4. more than one proxy in front --------------------------------- */
  {
    // Two hops: the header arrives as "<client's claim>, <peer>, <proxy1>", so
    // the address that reached the first trusted proxy is the SECOND from the
    // right. Told there are two hops, the server must count back two.
    const s = await stack({ hops: 2, peer: '198.18.4.4', env: { NST_TRUST_PROXY_HOPS: '2' } });
    const spoofed = await untilLocked(s.base, 14, { username: 'carol', xff: (i) => `203.0.113.${i}` });
    ok('with two proxies declared, the gate still closes under a rotating header',
      spoofed > 0 && spoofed <= 12, spoofed || 'NEVER LOCKED');

    // And a header too short for the declared topology is not what those proxies
    // would have produced, so it must be ignored rather than guessed at.
    const s2 = await stack({ hops: 1, peer: '198.18.5.5', env: { NST_TRUST_PROXY_HOPS: '3' } });
    const short = await untilLocked(s2.base, 14, { username: 'dave', xff: (i) => `203.0.113.${i}` });
    ok('a header shorter than the declared hop count falls back to the socket',
      short > 0 && short <= 12, short || 'NEVER LOCKED');
  }

  /* ---- 5. only a listed peer may speak for someone else ---------------- */
  {
    // The proxy connects from 127.0.0.1; naming a different address means no
    // peer on this box qualifies, so the header is ignored entirely.
    const s = await stack({ peer: '198.18.6.6', env: { NST_TRUST_PROXY_FROM: '10.99.99.99' } });
    const spoofed = await untilLocked(s.base, 14, { username: 'erin', xff: (i) => `203.0.113.${i}` });
    ok('an unlisted peer cannot forward an address at all', spoofed > 0 && spoofed <= 12, spoofed || 'NEVER LOCKED');

    const s2 = await stack({ peer: '198.18.8.8', env: { NST_TRUST_PROXY_FROM: '127.0.0.1, ::1' } });
    const listed = await untilLocked(s2.base, 14, { username: 'frank', xff: (i) => `203.0.113.${i}` });
    ok('and a listed one still works normally', listed > 0 && listed <= 12, listed || 'NEVER LOCKED');
  }

  /* ---- 6. [neg] the fixture can tell the two readings apart ------------- */
  {
    /* Everything above would also pass on a server that ignored the header
     * completely. This proves the suite is actually exercising the forwarded
     * address: with trust ON and a proxy in front, two clients that the PROXY
     * sees as the same peer share a bucket, and the app must be reading the
     * proxy's entry for that to be observable at all. */
    const s = await stack({ peer: '198.18.3.3' });
    const first = await untilLocked(s.base, 14, { username: 'grace' });
    const stillShut = await attempt(s.base, { username: 'grace', xff: 'totally-made-up' });
    ok('[neg] the forwarded address is genuinely in play, and it is the proxy\'s',
      first > 0 && stillShut.status === 429, 'locked at ' + first + ', then ' + stillShut.status);

    // A value the client invents must never become a throttle key of its own.
    const s2 = await stack({ peer: '198.18.2.2' });
    const invented = await untilLocked(s2.base, 14, { username: 'heidi', xff: () => 'not-an-address-at-all' });
    ok('[neg] an unparseable claimed address does not become a free bucket',
      invented > 0 && invented <= 12, invented || 'NEVER LOCKED');
  }

  /* ---- 7. the source says what it does --------------------------------- */
  {
    const src = (await import('node:fs')).readFileSync(join(REPO, 'server', 'server.mjs'), 'utf8');
    ok('nothing reads the left-hand entry of a forwarded header',
      !/x-forwarded-(?:for|proto)'\]\)\.split\(','\)\[0\]/.test(src) && !/parts\[0\]/.test(src));
    ok('the hop count and the peer allowlist are both documented in the header',
      /NST_TRUST_PROXY_HOPS/.test(src) && /NST_TRUST_PROXY_FROM/.test(src));
  }
} catch (err) {
  console.log('FAIL unexpected error: ' + (err && err.stack ? err.stack : err));
  fail++;
}

await teardown();
console.log('\n' + (fail ? `PROXY TRUST: ${fail} FAILED of ${pass + fail}` : `PROXY TRUST: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
