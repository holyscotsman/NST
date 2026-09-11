/* pages.mjs — the server-rendered pages: sign in, create account, change
 * password, and the root console. Rendered here rather than served as static
 * files so each one carries its own strict CSP and a per-request CSRF token,
 * and so the whole login surface is one reviewable file.
 *
 * Visual language deliberately matches the launcher (same fonts, same near-black
 * ground, same iris accent) so signing in feels like part of the tool.
 */

export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

const CSS = `
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:#08060f;color:#F2F2F7;
  font-family:'Manrope',ui-sans-serif,system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
  display:flex;align-items:center;justify-content:center;padding:24px}
body.wide{display:block;padding:28px 20px}
a{color:#AC9BFD}
.card{width:100%;max-width:420px;background:rgba(20,20,29,.92);border:1px solid #2b2b3e;
  border-radius:18px;padding:30px 28px;box-shadow:0 24px 70px rgba(0,0,0,.55)}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.brand .dot{width:10px;height:10px;border-radius:50%;background:linear-gradient(135deg,#8B5CF6,#22A9E8)}
.brand b{font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;font-size:15px;letter-spacing:.02em}
h1{font-family:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;font-size:26px;margin:14px 0 6px;letter-spacing:-.01em}
p.sub{margin:0 0 22px;color:#9A93B8;font-size:14px;line-height:1.5}
label{display:block;font-size:13px;font-weight:700;margin:16px 0 6px;color:#C9C4DE}
input[type=text],input[type=password]{width:100%;padding:12px 14px;border-radius:11px;
  border:1px solid #34344a;background:#101018;color:#F2F2F7;font:inherit;font-size:15px}
input:focus-visible{outline:2px solid #1FDDE9;outline-offset:2px;border-color:#7855FA}
button{width:100%;margin-top:22px;padding:13px 18px;border:none;border-radius:11px;cursor:pointer;
  font:inherit;font-weight:800;font-size:15px;color:#fff;
  background:linear-gradient(135deg,#8B5CF6,#6D3FE0);box-shadow:0 8px 22px rgba(139,92,246,.3)}
button:hover{background:linear-gradient(135deg,#9B6DFF,#7A4CF0)}
button:focus-visible{outline:2px solid #1FDDE9;outline-offset:2px}
button.ghost{background:none;border:1px solid #34344a;color:#C9C4DE;box-shadow:none;width:auto;
  padding:8px 14px;font-size:13px;margin:0}
button.ghost:hover{border-color:#7855FA;color:#fff;background:none}
button.danger{background:none;border:1px solid rgba(229,72,77,.5);color:#F0888B;box-shadow:none;width:auto;
  padding:8px 14px;font-size:13px;margin:0}
button.danger:hover{background:rgba(229,72,77,.14)}
.alt{margin-top:20px;text-align:center;font-size:14px;color:#9A93B8}
.msg{margin-top:18px;padding:11px 14px;border-radius:10px;font-size:14px;line-height:1.45}
.msg.err{background:rgba(229,72,77,.12);border:1px solid rgba(229,72,77,.45);color:#F5A3A5}
.msg.ok{background:rgba(146,221,35,.10);border:1px solid rgba(146,221,35,.4);color:#CDEB9B}
.msg.warn{background:rgba(255,200,87,.10);border:1px solid rgba(255,200,87,.45);color:#FFD98A}
.hint{margin-top:8px;font-size:12.5px;color:#7E77A0;line-height:1.5}
table{width:100%;border-collapse:collapse;margin-top:18px;font-size:14px}
th,td{text-align:left;padding:11px 10px;border-bottom:1px solid #24243a;vertical-align:middle}
th{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8B84AB;font-weight:700}
td.actions{white-space:nowrap;display:flex;gap:7px;flex-wrap:wrap}
.tag{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;
  padding:2px 8px;border-radius:999px;border:1px solid #34344a;color:#AC9BFD}
.tag.root{border-color:#FFC857;color:#FFC857}
.tag.off{border-color:#E5484D;color:#F0888B}
.wrap{max-width:1000px;margin:0 auto}
.bar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:6px}
.muted{color:#7E77A0;font-size:13px}
form.inline{display:inline}
@media (max-width:620px){
  .card{padding:24px 20px}
  table,thead,tbody,tr,td,th{display:block}
  thead{display:none}
  tr{border:1px solid #24243a;border-radius:12px;padding:10px;margin-bottom:12px}
  td{border:none;padding:5px 4px}
  td.actions{padding-top:10px}
}
`;

function shell(title, bodyHtml, { wide = false, csp = '' } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
<title>${esc(title)} · Nutanix Study Tool</title>
<meta name="color-scheme" content="dark" />
<meta name="robots" content="noindex, nofollow" />
<!-- frame-ancestors is sent as a real header (a <meta> copy is ignored). -->
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; form-action 'self'; base-uri 'none'${csp}" />
<link rel="stylesheet" href="/shared/fonts.css" />
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📘</text></svg>" />
<style>${CSS}</style>
</head>
<body${wide ? ' class="wide"' : ''}>
${bodyHtml}
</body>
</html>`;
}

const BRAND = `<div class="brand"><span class="dot"></span><b>Nutanix Study Tool</b></div>`;

function msg(kind, text) { return text ? `<div class="msg ${kind}">${esc(text)}</div>` : ''; }

export function loginPage({ error, notice, username = '', csrf, allowSignup = true }) {
  return shell('Sign in', `
<main class="card">
  ${BRAND}
  <h1>Sign in</h1>
  <p class="sub">Your progress is saved to your account, so it follows you to any browser or device.</p>
  ${msg('err', error)}${msg('ok', notice)}
  <form method="POST" action="/login" autocomplete="on">
    <input type="hidden" name="csrf" value="${esc(csrf)}" />
    <label for="u">Username</label>
    <input id="u" name="username" type="text" value="${esc(username)}" autocomplete="username"
           autocapitalize="none" autocorrect="off" spellcheck="false" required autofocus />
    <label for="p">Password</label>
    <input id="p" name="password" type="password" autocomplete="current-password" required />
    <button type="submit">Sign in</button>
  </form>
  ${allowSignup ? '<p class="alt">No account yet? <a href="/signup">Create one</a></p>' : ''}
</main>`);
}

export function signupPage({ error, username = '', displayName = '', csrf, minPassword }) {
  return shell('Create account', `
<main class="card">
  ${BRAND}
  <h1>Create your account</h1>
  <p class="sub">Pick a username and password. Nothing else is needed — there is no email and no verification.</p>
  ${msg('err', error)}
  <form method="POST" action="/signup" autocomplete="on">
    <input type="hidden" name="csrf" value="${esc(csrf)}" />
    <label for="u">Username</label>
    <input id="u" name="username" type="text" value="${esc(username)}" autocomplete="username"
           autocapitalize="none" autocorrect="off" spellcheck="false" required autofocus />
    <div class="hint">3–32 characters: letters, numbers, dot, dash or underscore.</div>
    <label for="d">Display name <span class="muted">(optional)</span></label>
    <input id="d" name="displayName" type="text" value="${esc(displayName)}" autocomplete="nickname" />
    <label for="p">Password</label>
    <input id="p" name="password" type="password" autocomplete="new-password" required />
    <div class="hint">At least ${minPassword} characters.</div>
    <label for="p2">Confirm password</label>
    <input id="p2" name="password2" type="password" autocomplete="new-password" required />
    <button type="submit">Create account</button>
  </form>
  <p class="alt">Already have one? <a href="/login">Sign in</a></p>
</main>`);
}

export function changePasswordPage({ error, notice, csrf, forced, minPassword }) {
  return shell('Change password', `
<main class="card">
  ${BRAND}
  <h1>${forced ? 'Set a new password' : 'Change your password'}</h1>
  <p class="sub">${forced
    ? 'An administrator set this password for you. Choose your own to continue.'
    : 'Signing in again elsewhere will need the new password.'}</p>
  ${msg('err', error)}${msg('ok', notice)}
  <form method="POST" action="/account/password" autocomplete="on">
    <input type="hidden" name="csrf" value="${esc(csrf)}" />
    <label for="c">Current password</label>
    <input id="c" name="current" type="password" autocomplete="current-password" required autofocus />
    <label for="p">New password</label>
    <input id="p" name="password" type="password" autocomplete="new-password" required />
    <div class="hint">At least ${minPassword} characters.</div>
    <label for="p2">Confirm new password</label>
    <input id="p2" name="password2" type="password" autocomplete="new-password" required />
    <button type="submit">Change password</button>
  </form>
  ${forced ? '' : '<p class="alt"><a href="/">Back to the study tool</a></p>'}
</main>`);
}

function when(ts) {
  if (!ts) return '<span class="muted">never</span>';
  const d = new Date(Number(ts));
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}
function bytes(n) {
  if (!n) return '<span class="muted">none</span>';
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

export function adminPage({ me, users, csrf, error, notice, defaultRootPassword, audit = [] }) {
  const rows = users.map((u) => {
    const isMe = u.id === me.id;
    const act = (action, label, cls, confirmText) => `
      <form class="inline" method="POST" action="/admin/${action}">
        <input type="hidden" name="csrf" value="${esc(csrf)}" />
        <input type="hidden" name="id" value="${u.id}" />
        <button class="${cls}" type="submit"${confirmText ? ` formnovalidate` : ''}>${esc(label)}</button>
      </form>`;
    return `<tr>
      <td><b>${esc(u.username)}</b>${u.display_name && u.display_name !== u.username ? `<div class="muted">${esc(u.display_name)}</div>` : ''}</td>
      <td><span class="tag ${u.role === 'root' ? 'root' : ''}">${esc(u.role)}</span>
          ${u.disabled ? '<span class="tag off">disabled</span>' : ''}
          ${u.must_change ? '<span class="tag">must reset</span>' : ''}</td>
      <td>${when(u.last_login_at)}<div class="muted">${u.active_sessions} active session(s)</div></td>
      <td>${bytes(u.progress_bytes)}<div class="muted">${u.progress_at ? when(u.progress_at) : ''}</div></td>
      <td class="actions">
        ${isMe ? '<span class="muted">that’s you</span>' : `
          ${act('reset', 'Reset password', 'ghost')}
          ${u.disabled ? act('enable', 'Enable', 'ghost') : act('disable', 'Disable', 'ghost')}
          ${u.role === 'root' ? act('demote', 'Make user', 'ghost') : act('promote', 'Make root', 'ghost')}
          ${act('delete', 'Delete', 'danger')}
        `}
      </td>
    </tr>`;
  }).join('');

  const log = audit.length ? `
    <h1 style="font-size:18px;margin-top:34px">Recent activity</h1>
    <table>
      <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
      <tbody>${audit.map((a) => `<tr><td>${when(a.at)}</td><td>${esc(a.actor || '—')}</td>
        <td>${esc(a.action)}${a.detail ? ` <span class="muted">${esc(a.detail)}</span>` : ''}</td></tr>`).join('')}</tbody>
    </table>` : '';

  return shell('Accounts', `
<div class="wrap">
  <div class="bar">
    ${BRAND}
    <div>
      <a href="/">← Study tool</a> &nbsp;
      <form class="inline" method="POST" action="/logout">
        <input type="hidden" name="csrf" value="${esc(csrf)}" />
        <button class="ghost" type="submit">Sign out</button>
      </form>
    </div>
  </div>
  <h1>Accounts</h1>
  <p class="sub">Signed in as <b>${esc(me.username)}</b> (root). ${users.length} account(s).</p>
  ${defaultRootPassword ? msg('warn',
    'The root account is still using the default password. Change it from "Change password" — anyone who can reach this server can sign in as root until you do.') : ''}
  ${msg('err', error)}${msg('ok', notice)}
  <table>
    <thead><tr><th>User</th><th>Role</th><th>Last seen</th><th>Progress</th><th>Actions</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="alt"><a href="/account/password">Change your own password</a></p>
  ${log}
</div>`, { wide: true });
}

export function errorPage(code, message) {
  return shell(String(code), `
<main class="card">
  ${BRAND}
  <h1>${esc(String(code))}</h1>
  <p class="sub">${esc(message)}</p>
  <p class="alt"><a href="/">Back to the study tool</a></p>
</main>`);
}
