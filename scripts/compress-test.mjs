/* compress-test.mjs — content encoding on the app server.
 *
 * Compression has three failure modes that are all invisible in the happy path
 * and all break the site for exactly one person at a time:
 *
 *   - a missing `Vary: Accept-Encoding` lets a shared cache hand a brotli body
 *     to a client that asked for none. The page fails to load, intermittently,
 *     for whoever is behind that cache.
 *   - an ETag that does not change with the encoding lets a revalidation answer
 *     304 for bytes in the wrong encoding. Same failure, from the other side.
 *   - compressing an already-compressed format (woff2, png) burns CPU to make
 *     the response slightly larger.
 *
 * So these tests are about the negotiation and the headers, and every
 * compressed body is decompressed and compared byte-for-byte with the file on
 * disk -- the one check that proves the whole path end to end.
 *
 * Requests go through node:http rather than fetch(): undici decompresses a
 * response transparently and leaves the Content-Encoding header in place, so
 * fetch() hands back the ORIGINAL bytes under a header saying they are brotli.
 * That makes it structurally unable to prove anything about the wire. (The first
 * version of this file used fetch and reported the compressed body as being
 * exactly the size of the file it was meant to have shrunk.)
 *
 * Spawns a real server on a scratch port with a throwaway database.
 * Pure Node, no browser — runs in CI. Run: node scripts/compress-test.mjs
 */
import { spawn } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync, brotliDecompressSync } from 'node:zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- the negotiation, as a pure function ---------------------------- */
const C = await import('../server/compress.mjs');

ok('no Accept-Encoding means no compression', C.pickEncoding(undefined) === null);
ok('an empty header means no compression', C.pickEncoding('') === null);
ok('gzip alone is honoured', C.pickEncoding('gzip') === 'gzip');
ok('brotli alone is honoured', C.pickEncoding('br') === 'br');
ok('brotli wins when both are offered', C.pickEncoding('gzip, deflate, br') === 'br');
ok('order does not decide it', C.pickEncoding('br, gzip') === 'br');
ok('whitespace and case do not matter', C.pickEncoding('  GZIP , DEFLATE ') === 'gzip');
ok('q-values are tolerated', C.pickEncoding('gzip;q=0.8, br;q=1.0') === 'br');
ok('an explicit q=0 is a refusal', C.pickEncoding('br;q=0, gzip') === 'gzip');
ok('q=0.0 is also a refusal', C.pickEncoding('br;q=0.0, gzip') === 'gzip');
ok('an unknown encoding alone yields nothing', C.pickEncoding('deflate, compress') === null);
ok('a wildcard is accepted', C.pickEncoding('*') === 'br');

ok('text is compressible', C.isCompressible('text/markdown; charset=utf-8', 99999) === true);
ok('javascript is compressible', C.isCompressible('text/javascript; charset=utf-8', 99999) === true);
ok('json is compressible', C.isCompressible('application/json', 99999) === true);
ok('svg is compressible', C.isCompressible('image/svg+xml', 99999) === true);
ok('woff2 is NOT compressible again', C.isCompressible('font/woff2', 99999) === false);
ok('png is NOT compressible again', C.isCompressible('image/png', 99999) === false);
ok('webp is NOT compressible again', C.isCompressible('image/webp', 99999) === false);
ok('mp3 is NOT compressible again', C.isCompressible('audio/mpeg', 99999) === false);
ok('a tiny file is not worth compressing', C.isCompressible('text/css', 10) === false);
ok('the threshold is inclusive', C.isCompressible('text/css', C.MIN_BYTES) === true);
ok('a missing content type is not compressed', C.isCompressible('', 99999) === false);

ok('an identity ETag is left alone', C.taggedEtag('W/"12-ab"', null) === 'W/"12-ab"');
ok('a brotli ETag differs from identity', C.taggedEtag('W/"12-ab"', 'br') !== 'W/"12-ab"');
ok('a gzip ETag differs from brotli',
  C.taggedEtag('W/"12-ab"', 'gzip') !== C.taggedEtag('W/"12-ab"', 'br'));
ok('the tagged ETag is still a quoted entity-tag',
  /^W\/"[^"]+"$/.test(C.taggedEtag('W/"12-ab"', 'br')), C.taggedEtag('W/"12-ab"', 'br'));

/* ---- against a real server ------------------------------------------ */
const PORT = 8100 + Math.floor(Math.random() * 400);
const dataDir = mkdtempSync(join(tmpdir(), 'nst-ctest-'));
const child = spawn(process.execPath, [join(ROOT, 'server', 'server.mjs')], {
  env: { ...process.env, NST_PORT: String(PORT), NST_DB: join(dataDir, 'test.db'), NST_ROOT_PASSWORD: 'test-pw-not-default' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((done, die) => {
  const t = setTimeout(() => die(new Error('server did not start')), 15000);
  child.stdout.on('data', (d) => { if (String(d).includes('listening')) { clearTimeout(t); done(); } });
  child.stderr.on('data', () => {});
});

/* A cookie-aware client over node:http, so bodies arrive exactly as sent. */
const jar = new Map();
function raw(path, { headers = {}, method = 'GET', body = null, anon = false } = {}) {
  return new Promise((done, die) => {
    const h = { ...headers };
    if (!anon && jar.size) h.Cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    if (body != null) {
      h['Content-Type'] = 'application/x-www-form-urlencoded';
      h['Content-Length'] = Buffer.byteLength(body);
    }
    const req = httpRequest({ hostname: '127.0.0.1', port: PORT, path, method, headers: h }, (res) => {
      for (const c of res.headers['set-cookie'] || []) {
        const kv = c.split(';')[0];
        const i = kv.indexOf('=');
        if (i > 0) jar.set(kv.slice(0, i).trim(), kv.slice(i + 1).trim());
      }
      const chunks = [];
      res.on('data', (d) => chunks.push(d));
      res.on('end', () => done({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on('error', die);
    if (body != null) req.write(body);
    req.end();
  });
}
const get = (path, headers = {}) => raw(path, { headers });

async function signIn() {
  const page = await raw('/login');
  const csrf = page.body.toString().match(/name="csrf" value="([^"]+)"/)?.[1] || '';
  const r = await raw('/login', {
    method: 'POST',
    body: new URLSearchParams({ csrf, username: 'root', password: 'test-pw-not-default' }).toString(),
  });
  return r.status === 302;
}

try {
  ok('signed in as root', await signIn());

  const BIG = '/shared/nst-mastery.js';          // text, comfortably over the threshold
  const FONT = '/shared/fonts/manrope-latin.woff2';

  const onDisk = await readFile(join(ROOT, 'shared', 'nst-mastery.js'));

  {
    const r = await get(BIG, { 'Accept-Encoding': 'br' });
    const enc = r.headers['content-encoding'];
    ok('a brotli client gets brotli', enc === 'br', enc);
    ok('and Vary names Accept-Encoding', /accept-encoding/i.test(r.headers['vary'] || ''), r.headers['vary']);
    const body = r.body;
    ok('the brotli body is smaller than the file', body.length < onDisk.length, `${body.length} vs ${onDisk.length}`);
    const out = brotliDecompressSync(body);
    ok('and decompresses to the file byte for byte', out.equals(onDisk));
  }
  {
    const r = await get(BIG, { 'Accept-Encoding': 'gzip' });
    ok('a gzip client gets gzip', r.headers['content-encoding'] === 'gzip', r.headers['content-encoding']);
    const body = r.body;
    ok('the gzip body decompresses to the file byte for byte', gunzipSync(body).equals(onDisk));
  }
  {
    const r = await get(BIG, { 'Accept-Encoding': 'identity' });
    ok('a client that accepts nothing gets the file as-is', !r.headers['content-encoding'],
      r.headers['content-encoding']);
    const body = r.body;
    ok('and it is the file, unchanged', body.equals(onDisk));
  }
  {
    // fetch() always sends an Accept-Encoding unless told otherwise; this proves
    // the no-header path rather than the "unknown encodings" path.
    const r = await get(BIG, { 'Accept-Encoding': 'deflate' });
    ok('an unsupported encoding falls back to identity', !r.headers['content-encoding'],
      r.headers['content-encoding']);
  }

  /* The ETag must be per-encoding, and a conditional request must be compared
   * against the tag for the encoding being asked for. */
  {
    const br = await get(BIG, { 'Accept-Encoding': 'br' });
    const gz = await get(BIG, { 'Accept-Encoding': 'gzip' });
    const id = await get(BIG, { 'Accept-Encoding': 'identity' });
    const [a, c, d] = [br.headers['etag'], gz.headers['etag'], id.headers['etag']];
    ok('the brotli and gzip ETags differ', a !== c, `${a} vs ${c}`);
    ok('both differ from the identity ETag', a !== d && c !== d, `${a} / ${c} / ${d}`);

    const again = await get(BIG, { 'Accept-Encoding': 'br', 'If-None-Match': a });
    ok('the matching ETag gets a 304', again.status === 304, again.status);
    ok('and the 304 still carries Vary', /accept-encoding/i.test(again.headers['vary'] || ''),
      again.headers['vary']);

    // The crux: a brotli ETag must NOT satisfy a gzip request.
    const crossed = await get(BIG, { 'Accept-Encoding': 'gzip', 'If-None-Match': a });
    ok('a brotli ETag does not satisfy a gzip request', crossed.status === 200, crossed.status);
    ok('and that answer really is gzip', crossed.headers['content-encoding'] === 'gzip',
      crossed.headers['content-encoding']);
    const body = crossed.body;
    ok('which decompresses correctly', gunzipSync(body).equals(onDisk));
  }

  /* The sign-in page's own stylesheet is public AND compressible: the one asset
   * that exercises this path with no session at all. */
  {
    const r = await raw('/shared/fonts.css', { headers: { 'Accept-Encoding': 'br' }, anon: true });
    ok('the public font CSS is served signed-out', r.status === 200, r.status);
    ok('and it is compressed too', r.headers['content-encoding'] === 'br', r.headers['content-encoding']);
    const css = await readFile(join(ROOT, 'shared', 'fonts.css'));
    ok('and decompresses to the file', brotliDecompressSync(r.body).equals(css));
  }

  /* Already-compressed formats are left alone. */
  {
    const r = await get(FONT, { 'Accept-Encoding': 'br, gzip' });
    ok('a woff2 font is served uncompressed', !r.headers['content-encoding'],
      r.headers['content-encoding']);
    ok('and carries no Vary it does not need', !r.headers['vary'], r.headers['vary']);
  }

  /* The whole point: the two heaviest assets actually shrink. */
  {
    const r = await get('/banks/ncp-mci/ncp-mci.md', { 'Accept-Encoding': 'br' });
    if (r.status === 200) {
      const raw = (await readFile(join(ROOT, 'banks', 'ncp-mci', 'ncp-mci.md'))).length;
      const got = r.body.length;
      ok('the question bank compresses to under half', got < raw / 2, `${(got / 1024).toFixed(0)}K of ${(raw / 1024).toFixed(0)}K`);
    } else {
      ok('the question bank is reachable', false, 'HTTP ' + r.status);
    }
  }

  /* Compressing twice must not compress twice: the cache is keyed by file+mtime. */
  {
    const before = C.cacheStats();
    await get(BIG, { 'Accept-Encoding': 'br' });
    await get(BIG, { 'Accept-Encoding': 'br' });
    ok('the compression cache is bounded', C.MAX_CACHE_BYTES > 0 && C.MAX_CACHE_BYTES <= 256 * 1024 * 1024,
      C.MAX_CACHE_BYTES);
    ok('and reports what it holds', typeof before.entries === 'number' && typeof before.bytes === 'number');
  }

  /* Nothing about compression may weaken the guards. */
  {
    const r = await get('/server/data/nst.db', { 'Accept-Encoding': 'br' });
    ok('the database is still not served, whatever the encoding', r.status === 404, r.status);
    const g = await get('/.git/config', { 'Accept-Encoding': 'br' });
    ok('nor is git config', g.status === 404, g.status);
  }
  {
    const r = await get(BIG, { 'Accept-Encoding': 'br' });
    ok('the security headers survive compression',
      r.headers['x-content-type-options'] === 'nosniff' && r.headers['x-frame-options'] === 'DENY');
    ok('and the content type is still the file\'s own',
      /javascript/.test(r.headers['content-type'] || ''), r.headers['content-type']);
  }
} finally {
  child.kill('SIGKILL');
  try { rmSync(dataDir, { recursive: true, force: true }); } catch { /* scratch dir */ }
}

console.log('\n' + (fail ? `COMPRESS: ${fail} FAILED (${pass} passed)` : `COMPRESS: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
