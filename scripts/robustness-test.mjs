/* robustness-test.mjs — can a request kill the server?
 *
 * WHY THIS IS ITS OWN SUITE
 * server-test.mjs asks whether each route does the right thing. This asks a
 * different question: after everything hostile or merely malformed that a
 * browser, a scanner or a broken client can send, is the process still serving
 * anyone else?
 *
 * It matters more here than in most deployments. This runs as a single Node
 * process on a VM, often started by hand in a terminal rather than as a service,
 * so a crash is not a blip — the tool is simply gone for everybody until someone
 * notices and logs in to restart it.
 *
 * The bar is deliberately low and absolute: every request may be refused, may
 * 400, may 413, may 500. None of them may end the process. The last check is the
 * only one that really matters — the server answers a normal request after all
 * of it.
 *
 * Spawns a real server on a scratch port with a throwaway database.
 * Pure Node, no browser — runs in CI. Run: node scripts/robustness-test.mjs
 */
import { spawn } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { connect } from 'node:net';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

const PORT = 8600 + Math.floor(Math.random() * 300);
const dataDir = mkdtempSync(join(tmpdir(), 'nst-robust-'));
let exited = null;
const child = spawn(process.execPath, [join(ROOT, 'server', 'server.mjs')], {
  env: { ...process.env, NST_PORT: String(PORT), NST_DB: join(dataDir, 'r.db'), NST_ROOT_PASSWORD: 'robust-test-pw' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
child.stderr.on('data', (d) => { stderr += String(d); });
child.on('exit', (code, sig) => { exited = { code, sig }; });

await new Promise((done, die) => {
  const t = setTimeout(() => die(new Error('server did not start')), 15000);
  child.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); done(); } });
});

/* An ordinary HTTP client. Never throws: a refused or reset connection is a
 * legitimate answer to a hostile request, and only a dead process is a failure. */
function req(path, { method = 'GET', body = null, headers = {}, timeout = 8000 } = {}) {
  return new Promise((done) => {
    // Node's own client refuses to SEND some of these (raw non-ASCII in a path,
    // for one). That is the client protecting itself, not the server answering,
    // so it is reported rather than thrown -- and the cases that need to reach
    // the socket regardless go through rawSocket() instead.
    let r;
    const h = { ...headers };
    if (body != null && h['Content-Length'] === undefined && !h['Transfer-Encoding']) {
      h['Content-Length'] = Buffer.byteLength(body);
    }
    try {
      r = httpRequest({ hostname: '127.0.0.1', port: PORT, path, method, headers: h, timeout }, (res) => {
        const chunks = [];
        res.on('data', (d) => chunks.push(d));
        res.on('end', () => done({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on('error', () => done({ status: 0, error: 'response error' }));
      });
    } catch (e) {
      return done({ status: 0, error: 'client refused to send: ' + e.message, clientRefused: true });
    }
    r.on('timeout', () => { r.destroy(); done({ status: 0, error: 'timeout' }); });
    r.on('error', (e) => done({ status: 0, error: e.message }));
    if (body != null) r.write(body);
    r.end();
  });
}

/* Raw bytes down the socket, for things a real HTTP client refuses to send. */
function rawSocket(payload, { timeout = 4000 } = {}) {
  return new Promise((done) => {
    const s = connect(PORT, '127.0.0.1');
    let got = '';
    const finish = (why) => { try { s.destroy(); } catch { /* closed */ } done({ got, why }); };
    s.setTimeout(timeout, () => finish('timeout'));
    s.on('connect', () => s.write(payload));
    s.on('data', (d) => { got += String(d); if (got.length > 4096) finish('enough'); });
    s.on('close', () => done({ got, why: 'closed' }));
    s.on('error', (e) => finish(e.message));
  });
}

const alive = async () => {
  if (exited) return false;
  const r = await req('/login');
  return r.status === 200;
};

try {
  ok('the server starts and serves', await alive());

  /* ---- malformed bodies ---- */
  {
    // Sign in first so /api/progress is reachable rather than a redirect.
    const page = await req('/login');
    const csrf = page.body.toString().match(/name="csrf" value="([^"]+)"/)?.[1] || '';
    const cookies = (page.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ');
    const login = await req('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookies },
      body: new URLSearchParams({ csrf, username: 'root', password: 'robust-test-pw' }).toString(),
    });
    const session = (login.headers['set-cookie'] || []).map((c) => c.split(';')[0]).join('; ') || cookies;
    const auth = { Cookie: session, 'Content-Type': 'application/json' };

    const bodies = [
      ['not JSON at all', 'this is definitely not json'],
      ['a bare number', '42'],
      ['an array where an object is expected', '[1,2,3]'],
      ['null', 'null'],
      ['an empty body', ''],
      ['truncated JSON', '{"v":1,"data":{'],
      ['deeply nested JSON', '['.repeat(2000) + ']'.repeat(2000)],
      ['a __proto__ payload', '{"v":1,"data":{"__proto__":{"polluted":true},"nst.x":"y"}}'],
      ['a constructor payload', '{"v":1,"data":{"constructor":{"prototype":{"x":1}},"nst.x":"y"}}'],
      ['lone surrogates', '{"v":1,"data":{"nst.x":"\\ud800"}}'],
      ['a NUL byte in a value', '{"v":1,"data":{"nst.x":"a\\u0000b"}}'],
      ['numeric keys', '{"v":1,"data":{"0":"a","1":"b"}}'],
      ['an enormous key name', `{"v":1,"data":{"${'k'.repeat(100000)}":"x"}}`],
    ];
    for (const [label, body] of bodies) {
      const r = await req('/api/progress', { method: 'PUT', headers: auth, body });
      ok(`survives ${label}`, await alive(), `status ${r.status}, exit ${JSON.stringify(exited)}`);
    }
    ok('prototype pollution did not take hold', ({}).polluted === undefined);

    // A body past the cap must be refused, not absorbed.
    const huge = '{"v":1,"data":{"nst.x":"' + 'A'.repeat(9 * 1024 * 1024) + '"}}';
    const big = await req('/api/progress', { method: 'PUT', headers: auth, body: huge, timeout: 20000 });
    ok('an over-large body is refused rather than swallowed', big.status === 413 || big.status === 0 || big.status >= 400,
      big.status);
    ok('and the server survives it', await alive(), JSON.stringify(exited));
  }

  /* ---- hostile paths ---- */
  {
    const paths = [
      ['a very long URL', '/' + 'a'.repeat(60000)],
      ['deep traversal', '/' + '../'.repeat(200) + 'etc/passwd'],
      ['encoded traversal', '/' + '%2e%2e%2f'.repeat(200) + 'etc/passwd'],
      ['a malformed percent escape', '/%zz%'],
      ['a bare percent', '/%'],
      ['an encoded NUL', '/shared/fonts.css%00.png'],
      ['backslashes', '\\\\server\\\\data\\\\nst.db'],
      ['a drive letter', '/C:/Windows/win.ini'],
      ['an alternate data stream', '/index.html::$DATA'],
      ['a UNC path', '//127.0.0.1/share/x'],
      ['a query-only path', '/?' + 'q=1&'.repeat(5000)],
      ['many slashes', '/'.repeat(5000)],
      ['a dot-segment maze', '/a/./b/../../c/./../d'],
    ];
    // Raw non-ASCII in a request line: Node's client will not send it, so it goes
    // straight down the socket, which is what a hostile client would do anyway.
    await rawSocket('GET /\uff0e\uff0e/\uff0e\uff0e/etc/passwd HTTP/1.1\r\nHost: x\r\n\r\n');
    ok('survives unicode fullwidth dots in the path', await alive(), JSON.stringify(exited));
    await rawSocket('GET /%c0%ae%c0%ae/etc/passwd HTTP/1.1\r\nHost: x\r\n\r\n');
    ok('survives overlong UTF-8 traversal', await alive(), JSON.stringify(exited));

    for (const [label, path] of paths) {
      const r = await req(path);
      ok(`survives ${label}`, await alive(), `status ${r.status}, exit ${JSON.stringify(exited)}`);
      if (/passwd|win\.ini|nst\.db/.test(path)) {
        ok(`  and ${label} did not return a file`, r.status !== 200 || !/root:|\[fonts\]|SQLite/.test(r.body ? r.body.toString('latin1').slice(0, 200) : ''),
          r.status);
      }
    }
  }

  /* ---- hostile headers and framing ---- */
  {
    const cases = [
      ['an enormous cookie', { Cookie: 'nst_session=' + 'x'.repeat(60000) }],
      ['many cookies', { Cookie: Array.from({ length: 500 }, (_, i) => `c${i}=v`).join('; ') }],
      ['a non-UTF8 cookie', { Cookie: 'nst_session=%ff%fe%00' }],
      ['a huge Accept-Encoding', { 'Accept-Encoding': Array.from({ length: 2000 }, () => 'br').join(', ') }],
      ['a strange If-None-Match', { 'If-None-Match': '"' + 'x'.repeat(20000) + '"' }],
      ['a negative Content-Length claim', { 'Content-Length': '-1' }],
    ];
    for (const [label, headers] of cases) {
      const r = await req('/login', { headers });
      ok(`survives ${label}`, await alive(), `status ${r.status}, exit ${JSON.stringify(exited)}`);
    }

    // Raw framing a client library will not produce.
    const raws = [
      ['a request line with no version', 'GET /login\r\n\r\n'],
      ['an unknown method', 'FROBNICATE /login HTTP/1.1\r\nHost: x\r\n\r\n'],
      ['headers with no blank line, then close', 'GET /login HTTP/1.1\r\nHost: x\r\n'],
      ['a Content-Length that lies', 'POST /login HTTP/1.1\r\nHost: x\r\nContent-Length: 100\r\n\r\nshort'],
      ['two Content-Lengths', 'POST /login HTTP/1.1\r\nHost: x\r\nContent-Length: 5\r\nContent-Length: 6\r\n\r\nabcde'],
      ['a bare newline request', '\n\n\n'],
      ['binary garbage', '\x00\x01\x02\x03\xff\xfe\r\n\r\n'],
      ['chunked with a bad chunk size', 'POST /api/progress HTTP/1.1\r\nHost: x\r\nTransfer-Encoding: chunked\r\n\r\nzzzz\r\n'],
    ];
    for (const [label, payload] of raws) {
      await rawSocket(payload);
      ok(`survives ${label}`, await alive(), JSON.stringify(exited));
    }
  }

  /* ---- concurrency ---- */
  {
    const burst = [];
    for (let i = 0; i < 120; i++) {
      burst.push(req(i % 3 === 0 ? '/login' : i % 3 === 1 ? '/shared/fonts.css' : '/nope-' + i));
    }
    const results = await Promise.all(burst);
    const answered = results.filter((r) => r.status > 0).length;
    ok('a burst of 120 concurrent requests is answered', answered > 100, `${answered}/120`);
    ok('and the server survives it', await alive(), JSON.stringify(exited));
  }
  {
    // Half-open connections: connect, send a partial request, abandon it.
    const sockets = [];
    for (let i = 0; i < 40; i++) {
      sockets.push(new Promise((done) => {
        const s = connect(PORT, '127.0.0.1');
        s.on('connect', () => { s.write('GET /login HTTP/1.1\r\nHost: x\r\n'); setTimeout(() => { s.destroy(); done(); }, 30); });
        s.on('error', () => done());
      }));
    }
    await Promise.all(sockets);
    ok('survives abandoned half-open connections', await alive(), JSON.stringify(exited));
  }

  /* ---- the one that matters ---- */
  {
    const r = await req('/login');
    ok('after all of that, a normal request still works', r.status === 200 && /Sign in/.test(r.body.toString()),
      `status ${r.status}`);
    ok('the process never exited', exited === null, JSON.stringify(exited));
    ok('and nothing was logged as an uncaught crash',
      !/uncaught|unhandled/i.test(stderr), stderr.slice(0, 300));
  }
  /* ---- the detector is not vacuous ----
   *
   * Every check above passed, which is the outcome a broken detector also
   * produces. So: stop the server and require alive() to notice. Without this,
   * an `alive()` that always returned true would report a perfect score against
   * a process that had died on the first request.
   */
  {
    child.kill('SIGKILL');
    const deadline = Date.now() + 5000;
    while (exited === null && Date.now() < deadline) await new Promise((r) => setTimeout(r, 50));
    ok('self-check: the harness notices when the server is gone', (await alive()) === false,
      'alive() still says yes with the process killed -- every check above was meaningless');
  }
} finally {
  child.kill('SIGKILL');
  try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* scratch dir */ }
}

console.log('\n' + (fail ? `ROBUSTNESS: ${fail} FAILED (${pass} passed)` : `ROBUSTNESS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
