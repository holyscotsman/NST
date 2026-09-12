/* compress.mjs — content encoding for the static files the server sends.
 *
 * WHY THIS EXISTS
 * Measured cold loads over the app server: StarNix ships as one 2868 KB HTML
 * file, and every entry point fetches the 368 KB question bank. Both are text,
 * both were going out uncompressed, and the VM may well be reached over a VPN
 * rather than the LAN. Brotli takes StarNix to roughly half and the bank to
 * about a fifth.
 *
 * THREE THINGS THAT ARE EASY TO GET WRONG, SO THEY ARE THE POINT OF THIS FILE
 *
 *   1. `Vary: Accept-Encoding` is not optional. Without it a shared cache can
 *      hand a brotli body to a client that asked for none, and the page simply
 *      fails to load for that one person, intermittently.
 *
 *   2. The ETag has to change with the encoding. An identity ETag matched
 *      against a compressed body is the same bug from the other direction:
 *      the client revalidates, gets a 304, and reuses bytes in the wrong
 *      encoding.
 *
 *   3. Brotli at its default quality (11) takes 3.8 SECONDS on the 2.8 MB
 *      StarNix build, to save 3.6% over quality 5's 67 ms. Compression is done
 *      once per (file, mtime, encoding) and cached in memory, and the quality is
 *      set so that even the first request is not a stall.
 *
 * Already-compressed formats (woff2, png, webp, mp3) are left alone: re-
 * compressing them costs CPU to make them very slightly larger.
 */
import { promisify } from 'node:util';
import { gzip as gzipCb, brotliCompress as brCb, constants as Z } from 'node:zlib';

const gzip = promisify(gzipCb);
const brotli = promisify(brCb);

/* Only these are worth compressing; everything else is already compact or
 * already compressed. Keyed by the Content-Type the server is about to send. */
const COMPRESSIBLE = /^(?:text\/|application\/(?:json|javascript|xml|wasm)|image\/svg\+xml)/;

/* Below this, framing and CPU cost more than the saving. */
export const MIN_BYTES = 1024;

/* Brotli quality. Measured on StarNix's 2868 KB single-file build:
 *
 *     quality 5   →  1350 KB in    67 ms
 *     quality 11  →  1301 KB in  3846 ms     (the library default)
 *     gzip        →  1390 KB in    75 ms
 *
 * The default would stall the first request for nearly four seconds to save a
 * further 3.6%. Gzip stays at its own default, which is already well placed. */
const BR_QUALITY = 5;

/* Compressed bodies, keyed by file+mtime+encoding. Bounded by total bytes, not
 * entry count: one StarNix build is worth thousands of small files. */
const CACHE = new Map();
export const MAX_CACHE_BYTES = 96 * 1024 * 1024;
let cacheBytes = 0;

export function cacheStats() { return { entries: CACHE.size, bytes: cacheBytes }; }
export function clearCache() { CACHE.clear(); cacheBytes = 0; }

/* Which encoding to use, given what the client said it accepts.
 *
 * Deliberately simple: this is a study tool on a LAN, not a CDN, so q-values
 * beyond "is it named and not q=0" are not worth the parsing. Brotli wins when
 * both are offered -- it is smaller on text and every browser that speaks it
 * also speaks gzip, so there is no downside. */
export function pickEncoding(acceptEncoding) {
  const raw = String(acceptEncoding || '').toLowerCase();
  if (!raw) return null;
  const offers = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const wants = (name) => offers.some((o) => {
    const [enc, ...params] = o.split(';').map((x) => x.trim());
    if (enc !== name && enc !== '*') return false;
    // "gzip;q=0" means explicitly NOT acceptable.
    return !params.some((pp) => /^q=0(?:\.0+)?$/.test(pp));
  });
  if (wants('br')) return 'br';
  if (wants('gzip')) return 'gzip';
  return null;
}

export function isCompressible(contentType, size) {
  if (!contentType) return false;
  if (!(size >= MIN_BYTES)) return false;
  return COMPRESSIBLE.test(String(contentType));
}

/* An ETag that is specific to the encoding it describes -- see the header. */
export function taggedEtag(baseEtag, encoding) {
  if (!encoding) return baseEtag;
  // Keep it a valid (weak) entity-tag: the suffix goes inside the quotes.
  return baseEtag.replace(/"$/, `-${encoding}"`);
}

function evictTo(limit) {
  // Insertion order is eviction order: oldest compressed first. A build replaces
  // its own entries by key anyway, so this only trims genuinely cold ones.
  for (const [k, v] of CACHE) {
    if (cacheBytes <= limit) break;
    CACHE.delete(k);
    cacheBytes -= v.length;
  }
}

/* Compress `body`, reusing a previous result for the same file and mtime.
 * Returns the compressed Buffer, or null if it did not help. */
export async function encode(body, encoding, key) {
  if (!encoding) return null;
  const ck = `${key}:${encoding}`;
  const hit = CACHE.get(ck);
  if (hit) return hit;

  let out;
  try {
    out = encoding === 'br'
      ? await brotli(body, {
        params: {
          [Z.BROTLI_PARAM_QUALITY]: BR_QUALITY,
          [Z.BROTLI_PARAM_SIZE_HINT]: body.length,
        },
      })
      : await gzip(body);
  } catch {
    return null;                       // never fail a response over compression
  }
  // If it did not actually shrink, send the original.
  if (!out || out.length >= body.length) return null;

  CACHE.set(ck, out);
  cacheBytes += out.length;
  if (cacheBytes > MAX_CACHE_BYTES) evictTo(MAX_CACHE_BYTES);
  return out;
}
