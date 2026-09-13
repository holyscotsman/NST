/* pages-test.mjs — the HTML the server hands out, and the one mistake that
 * would matter.
 *
 * server/pages.mjs builds every page the login server serves, by string
 * interpolation, from data users control: a username, a display name someone
 * chose at self-registration, an error echoed back. Three hundred lines of it,
 * and not one direct test.
 *
 * The attack is short. Sign yourself up with a display name of
 * `<img src=x onerror=...>`; root opens /admin to see who has registered; the
 * script runs in root's session. Nothing about that requires access this server
 * does not deliberately hand out -- self-registration is on by default.
 *
 * It does not happen: every interpolation is escaped, and this was confirmed
 * against a running instance before the suite was written -- the payload comes
 * back as text, no element is injected, no script tag exists on the page. This
 * is the gate that keeps it that way, because a single forgotten esc() in a
 * later edit is a stored cross-site script against the one account that can
 * delete everybody's progress.
 *
 * The page checks are written as a SWEEP rather than a list: every exported
 * builder is called with hostile values in every string it accepts, so a page
 * added later is covered the day it is added rather than the day somebody
 * remembers to add a case for it.
 *
 * Pure Node, no browser. Run: node scripts/pages-test.mjs
 */
import * as P from '../server/pages.mjs';

let pass = 0, fail = 0;
const ok = (name, cond, extra) => {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name + (extra !== undefined ? '  -- ' + extra : '')); }
};

/* ---- esc() itself ---- */
{
  ok('escapes <', P.esc('<') === '&lt;');
  ok('escapes >', P.esc('>') === '&gt;');
  ok('escapes &', P.esc('&') === '&amp;');
  ok('escapes a double quote -- attribute values are quoted with it',
    P.esc('"') === '&quot;');
  ok("escapes a single quote too", P.esc("'") === '&#39;');
  ok('escapes & FIRST, or every other escape becomes double-escaped text',
    P.esc('<&>') === '&lt;&amp;&gt;', P.esc('<&>'));
  ok('escapes every occurrence, not just the first',
    P.esc('<<<') === '&lt;&lt;&lt;', P.esc('<<<'));
  ok('null becomes empty, not the word "null"', P.esc(null) === '');
  ok('undefined becomes empty', P.esc(undefined) === '');
  ok('a number survives as its digits', P.esc(42) === '42');
  ok('an object cannot smuggle markup through toString',
    !/[<>]/.test(P.esc({ toString: () => '<script>' })), P.esc({ toString: () => '<script>' }));
  ok('a full payload comes out inert',
    P.esc('<img src=x onerror="alert(1)">') === '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
}

/* ---- every page, with hostile values in every field ---- */
{
  /* Distinct markers so a failure says WHICH field leaked. Each is dangerous in
   * a different place: element context, attribute context, and quote-breakouts
   * of both kinds. */
  const PAYLOADS = [
    '<script>NST_PWN=1</script>',
    '<img src=x onerror=NST_PWN=1>',
    '"><svg/onload=NST_PWN=1>',
    "'><iframe src=javascript:NST_PWN=1>",
    '</textarea></title></style><script>NST_PWN=1</script>',
    'javascript:NST_PWN=1',
  ];

  /* A plausible argument for each builder, with every string slot hostile.
   *
   * Every slot gets a DISTINCT hostile value, and that is not cosmetic. The
   * first version of this used one value everywhere, so `username` and
   * `display_name` matched -- and the admin page renders the display name only
   * when it differs from the username. That branch never ran, and removing its
   * esc() left all 159 checks green. A sweep that cannot reach a field does not
   * cover it. The suffix also makes a failure say WHICH field leaked. */
  const build = (evil) => ({
    loginPage: [{ error: evil + 'ERR', notice: evil + 'NOTICE', username: evil + 'USER', csrf: evil + 'CSRF', allowSignup: true }],
    signupPage: [{ error: evil + 'ERR', username: evil + 'USER', displayName: evil + 'DISPLAY', csrf: evil + 'CSRF', minPassword: 8 }],
    changePasswordPage: [{ error: evil + 'ERR', notice: evil + 'NOTICE', csrf: evil + 'CSRF', forced: true, minPassword: 8 }],
    adminPage: [{
      me: { username: evil, role: 'root' },
      users: [{
        id: 1, username: evil + 'USER', display_name: evil + 'DISPLAY', role: evil + 'ROLE',
        disabled: 0, must_change: 1,
        last_login_at: Date.now(), active_sessions: 1, progress_bytes: 10, progress_at: Date.now(),
      }],
      csrf: evil + 'CSRF', error: evil + 'ERR', notice: evil + 'NOTICE', defaultRootPassword: true,
      audit: [{ at: Date.now(), actor: evil + 'ACTOR', action: evil + 'ACTION', detail: evil + 'DETAIL' }],
      version: evil + 'VER', repo: evil + 'REPO',
    }],
    updatedPage: [{ from: evil + 'FROM', to: evil + 'TO', copied: 3 }],
    errorPage: [500, evil + 'MSG'],
  });

  const builders = Object.keys(P).filter((k) => typeof P[k] === 'function' && k !== 'esc');
  ok('there are page builders to sweep', builders.length >= 5, builders.length);

  const args = build('x');
  const uncovered = builders.filter((b) => !args[b]);
  ok('every exported page builder is covered by this sweep -- a new page is not exempt',
    uncovered.length === 0, uncovered.join(', '));

  for (const evil of PAYLOADS) {
    const set = build(evil);
    for (const name of builders) {
      if (!set[name]) continue;
      let html = null, threw = null;
      try { html = P[name](...set[name]); } catch (e) { threw = e.message; }
      ok(`${name} does not throw on hostile input`, threw === null, threw);
      if (html === null) continue;
      ok(`${name} returns a string`, typeof html === 'string');

      /* Two rules, both written narrowly on purpose. Blunter versions of each
       * failed against correct code and had to be corrected:
       *
       *  - "never emits the payload verbatim" is wrong for a payload with no
       *    escapable characters. `javascript:NST_PWN=1` SHOULD come through as
       *    written -- as inert text in a <p>, it is a string, not a link. The
       *    rule only means anything for payloads carrying < > & " '.
       *  - "contains no <svg or <iframe" flagged every page, because the shell's
       *    favicon is a data: URI containing <svg>. The question is never
       *    whether a tag exists; it is whether a tag carrying the PAYLOAD's
       *    marker exists. */
      if (/[<>&"']/.test(evil)) {
        ok(`${name} never emits a payload with markup in it verbatim  [${evil.slice(0, 22)}]`,
          !html.includes(evil), 'found it verbatim in the output');
      }
      /* Derive the check from the payload rather than pattern-matching the
       * output for "dangerous-looking" markup. An earlier version asked whether
       * any tag contained the marker, and flagged
       *   <input ... value="&lt;script&gt;NST_PWN=1&lt;/script&gt;">
       * -- a correctly escaped value sitting inside a legitimate tag. The
       * question is not whether the marker appears near a tag. It is whether
       * the payload's OWN raw tag-opening survived: escaping turns `<script`
       * into `&lt;script`, so its presence is injection and its absence is
       * proof, with nothing to interpret. */
      const openings = [];
      for (let at = evil.indexOf('<'); at >= 0; at = evil.indexOf('<', at + 1)) {
        // Opening tags only. A payload's CLOSING tags collide with the page's
        // own -- every page legitimately contains </title> and </style> -- and
        // a closing tag injects nothing by itself. The `<script>` that follows
        // them in a breakout payload is an opening tag and is still checked.
        if (evil[at + 1] === '/') continue;
        openings.push(evil.slice(at, at + 8));
      }
      const survived = openings.filter((frag) => html.includes(frag));
      ok(`${name} lets no raw tag-opening from the payload through  [${evil.slice(0, 22)}]`,
        survived.length === 0, survived.join(' '));
    }
  }
}

/* ---- the shape of a page, so the escaping is not vacuously true ---- */
{
  // A builder that returned "" would pass every check above. Prove they render.
  const login = P.loginPage({ csrf: 'tok', allowSignup: true });
  ok('the login page is actually a page', /<form/.test(login) && login.length > 400, login.length);
  ok('and carries its CSRF token', /name="csrf" value="tok"/.test(login));

  const admin = P.adminPage({
    me: { username: 'root', role: 'root' },
    users: [{ id: 1, username: 'jason', display_name: 'Jason S', role: 'user', disabled: 0,
      must_change: 0, last_login_at: Date.now(), active_sessions: 2, progress_bytes: 1024, progress_at: Date.now() }],
    csrf: 'tok', audit: [], version: '2.32.0', repo: '',
  });
  ok('the admin page lists the accounts it was given', /jason/.test(admin));
  ok('and shows a display name beside the username', /Jason S/.test(admin));
  ok('an ordinary name is not mangled by the escaping', !/&lt;|&amp;/.test('Jason S') && /Jason S/.test(admin));

  const err = P.errorPage(404, "That page isn't here.");
  ok('the error page states its code', /404/.test(err));
  ok("and escapes the apostrophe in its own message", /isn&#39;t/.test(err), err.match(/isn.{0,8}t/));
}

console.log('\n' + (fail ? `PAGES: ${fail} FAILED (${pass} passed)` : `PAGES: ALL GREEN (${pass} checks)`));
process.exit(fail ? 1 : 0);
