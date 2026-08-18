/* preload-three.js — warm the three.js fetch only when it will actually be used.
 *
 * studio.js (and through it the 652 KB three.js bundle) is deliberately behind a
 * dynamic import: boot() short-circuits to the "no question bank" screen before
 * ever reaching it, so a visitor who has not chosen a bank yet needs none of it.
 *
 * A static <link rel="modulepreload"> in the HTML defeated that — it fetched the
 * whole bundle with the document regardless, which on the no-bank path was 652 KB
 * of the page's 999 KB spent on a module that is never imported. Injecting the
 * preload from here keeps the head start on the path that needs it, and skips the
 * download entirely on the path that does not.
 *
 * Classic script (not a module) so it runs before the module entry point resolves.
 */
(function () {
  'use strict';
  var willBootStudio = false;
  try {
    // The 3D studio only boots once a bank is active; boot() bails to the
    // "no question bank" screen otherwise, never importing studio.js.
    var hasBank = !!(window.NSTBank && window.NSTBank.active && window.NSTBank.active());
    // E2E runs set this to skip the GPU-bound backdrop; three is never imported then.
    var skipGl = false;
    try { skipGl = localStorage.getItem('wwtbane.nogl') === '1'; } catch (e) { /* ignore */ }
    willBootStudio = hasBank && !skipGl;
  } catch (e) { return; }
  if (!willBootStudio) return;
  var link = document.createElement('link');
  link.rel = 'modulepreload';
  link.href = './vendor/three/build/three.module.min.js';
  document.head.appendChild(link);
})();
