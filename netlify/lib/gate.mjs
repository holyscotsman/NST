/* gate.mjs — "is there a live session behind this cookie?", for the edge function that keeps
 * /ncm-practice/ for signed-in people. Pure: it gets the Cookie header and a query function. */
export async function sessionAllowed(cookieHeader, q, sha256Hex, now = Date.now()) {
  const m = /(?:^|;\s*)nst_session=([^;]*)/.exec(String(cookieHeader || ''));
  if (!m) return false;
  let token = m[1];
  try { token = decodeURIComponent(token); } catch { /* keep verbatim: it will simply not match */ }
  if (!token) return false;
  const rows = await q(
    `SELECT 1 AS ok FROM nst_sessions s JOIN nst_users u ON u.id = s.user_id
     WHERE s.token_hash = $1 AND s.expires_at > $2 AND u.disabled = 0 AND u.must_change = 0 LIMIT 1`,
    [await sha256Hex(token), now]);
  return rows.length > 0;
}
