/* Keeps the NCM-MCI lab practice section for signed-in people.
 *
 * The files are ordinary static files in the deploy; this runs in front of them. No valid session cookie: a
 * redirect to the sign-in page, which sends the person back here afterwards. It fails closed: if the check
 * itself errors, nothing is served. */
import { getDatabase } from '@netlify/database';
import { queryFrom } from '../lib/db.mjs';
import { sessionAllowed } from '../lib/gate.mjs';

const sha256Hex = async (s) => {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

export default async (request, context) => {
  let ok = false;
  try { ok = await sessionAllowed(request.headers.get('cookie'), queryFrom(getDatabase()), sha256Hex); }
  catch (e) { console.error('ncm-gate: session check failed', e && e.message); }
  if (ok) {
    const res = await context.next();
    res.headers.set('Cache-Control', 'private, no-store');     // never let a shared cache hand this to someone signed out
    return res;
  }
  const url = new URL(request.url);
  return Response.redirect(new URL('/login?next=' + encodeURIComponent(url.pathname + url.search), url), 303);
};

export const config = { path: ['/ncm-practice', '/ncm-practice/*'], onError: 'fail' };
