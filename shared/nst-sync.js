/* Nutanix Study Tool — account sync (window.NSTSync).
 *
 * When the tool is served from the VM (server/server.mjs) every page is behind a
 * login, and this mirrors the browser's local progress to that account so it
 * follows the person rather than the browser.
 *
 * Design: the apps keep using localStorage as their working store. Nothing in
 * StarNix, WWTBANE or Practice Exams has to know an account exists — they read
 * and write locally as they always have, and this module moves the same envelope
 * shared/nst-backup.js already produces between here and the server. That means:
 *   - no rewrite of three storage layers
 *   - the app still works if the network drops mid-session
 *   - a server blob and a downloaded backup file are the same format
 *
 * On a static host (GitHub Pages, file://) /api/me simply 404s and this module
 * stays dormant, so the same build works in both places.
 */
(function () {
  "use strict";

  var PUSH_DEBOUNCE_MS = 2500;
  var state = {
    enabled: false, user: null, lastPushed: "", pushTimer: null,
    lastError: null, busy: false, failures: 0,
    // The account id this browser was stamped with before the current sign-in,
    // when it was a different one. Null on every ordinary load.
    switchedFrom: null,
  };

  /* How many consecutive failed pushes before the page is told. One is a hiccup
   * the next push covers; three means something is actually wrong. */
  var FAILURES_BEFORE_WARNING = 3;

  /* Let the page show sync trouble. Fired only when the state CHANGES, so a
   * healthy session never sees an event and a broken one says it once. */
  // Starts false, not null: "fine" is the assumed state, so a session that is
  // fine throughout never fires anything. Starting at null made the first
  // successful push announce an all-clear for trouble that never happened.
  var announced = false;
  function announce() {
    var stuck = state.failures >= FAILURES_BEFORE_WARNING;
    if (stuck === announced) return;
    announced = stuck;
    try {
      window.dispatchEvent(new CustomEvent("nst-sync-status", {
        detail: { ok: !stuck, failures: state.failures, error: state.lastError },
      }));
    } catch (e) { /* no CustomEvent here; the sync itself is unaffected */ }
  }

  function backup() { return window.NSTBackup || null; }

  /* WHICH ACCOUNT THIS BROWSER'S PROGRESS BELONGS TO
   *
   * localStorage is per-browser; an account is per-person. Signing out deletes
   * the server session and deliberately leaves the study record alone -- it has
   * to, or studying offline or on a static host would be impossible. But nothing
   * recorded WHOSE record it was, and `start()` merges whatever is local into
   * the account that just signed in and then force-pushes the result.
   *
   * On a machine two colleagues share, that is not a merge, it is a transfer.
   * Measured, with one browser and two accounts:
   *
   *     localStorage after sign-out        nst.mastery.v1, nst.activeBank
   *     signed in as                       bob
   *     bob's account contains alice's ids true  (12 of 12)
   *
   * Alice's twelve questions, permanently in Bob's account, feeding his mastery
   * scheduler, his readiness estimate and his review queue.
   *
   * So the browser now carries a stamp saying who last synced here. A stamp that
   * does not match the account signing in means this record is someone else's:
   * it is cleared rather than merged, and never pushed.
   *
   * NO stamp with local data present is the case the original comment describes
   * -- "a first sign-in adopts existing local progress" -- and is still adopted,
   * once. After that the stamp exists and every later switch is seen. */
  var OWNER_KEY = "nst.sync.owner";
  function storedOwner() {
    try { return window.localStorage.getItem(OWNER_KEY) || ""; } catch (e) { return ""; }
  }
  function stampOwner(id) {
    try { window.localStorage.setItem(OWNER_KEY, String(id)); } catch (e) { /* private mode */ }
  }

  function api(path, opts) {
    return fetch(path, Object.assign({
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
    }, opts || {})).then(function (r) {
      if (r.status === 401) { state.enabled = false; throw new Error("signed out"); }
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  /* Pull the account's progress and write it into this browser.
   *
   * `mode` is "replace" on a fresh browser and "merge" when there is already
   * local progress: someone who studied offline, or on another device, should
   * not silently lose that by opening the page.
   *
   * "merge" has to mean merge WITHIN a value, not just across keys, and until
   * v2.18.0 it did not. All mastery lives in one localStorage key, so pulling
   * the account's copy replaced this browser's entire history with the server's.
   * Study on a laptop, open it on a phone, and the laptop's morning vanished --
   * then the next push sent the loss back up. shared/nst-backup.js now combines
   * that key record by record; this path gets it for free. */
  function pull() {
    var B = backup();
    if (!B) return Promise.resolve({ ok: false, reason: "no backup module" });
    return api("/api/progress").then(function (res) {
      if (!res || !res.data) return { ok: true, restored: 0, reason: "nothing stored yet" };
      var local = B.summarize(B.collect());
      var mode = local.keys ? "merge" : "replace";
      var out = B.restore(JSON.stringify(res.data), { mode: mode });
      if (out.ok) state.lastPushed = snapshot();
      return { ok: !!out.ok, mode: mode, restored: out.ok ? out.restored.keys : 0, error: out.error };
    });
  }

  function snapshot() {
    var B = backup();
    if (!B) return "";
    try { return JSON.stringify(B.collect()); } catch (e) { return ""; }
  }

  /* Push, but only when something actually changed — this fires on a timer and
   * on page-hide, and re-sending an identical blob would just be noise. */
  function push(force) {
    var B = backup();
    if (!B || !state.enabled) return Promise.resolve({ ok: false });
    var snap = snapshot();
    if (!force && snap === state.lastPushed) return Promise.resolve({ ok: true, skipped: true });
    if (!snap || snap === "{}") return Promise.resolve({ ok: true, skipped: true });
    state.busy = true;
    return api("/api/progress", { method: "PUT", body: JSON.stringify(B.envelope()) })
      .then(function (r) {
        state.lastPushed = snap; state.lastError = null; state.failures = 0;
        announce(); return { ok: true, at: r.updatedAt };
      })
      .catch(function (e) {
        // Silence is what makes this dangerous: someone keeps studying for an
        // hour while nothing reaches their account. One failure is a hiccup the
        // next push covers; a run of them is worth saying out loud.
        state.lastError = e.message; state.failures = (state.failures || 0) + 1;
        announce(); return { ok: false, error: e.message };
      })
      .then(function (r) { state.busy = false; return r; });
  }

  function schedulePush() {
    if (!state.enabled) return;
    if (state.pushTimer) clearTimeout(state.pushTimer);
    state.pushTimer = setTimeout(function () { state.pushTimer = null; push(false); }, PUSH_DEBOUNCE_MS);
  }

  /* keepalive bodies are capped at 64 KB by the browser, across ALL in-flight
   * keepalive requests. Measured with the full 255-question bank studied plus the
   * game saves and exam history a regular user accumulates, the envelope is
   * 60.5 KB -- 94% of the cap, and the mastery store alone is 43 KB for ONE bank.
   * A second cert's bank takes it over on its own.
   *
   * Over the cap the request is rejected and nothing says so. Sitting this close
   * to a silent cliff is not a place to leave a data path, so the size is checked
   * and the oversized case falls back to an ordinary fetch: less likely to
   * survive the page going away, but it either works or it does not, rather than
   * never working while appearing to. */
  var KEEPALIVE_SAFE_BYTES = 56 * 1024;

  function bodyBytes(text) {
    try { return new Blob([text]).size; } catch (e) { return text.length; }
  }

  /* A last-chance push as the tab goes away. */
  function flushOnHide() {
    var B = backup();
    if (!B || !state.enabled) return;
    // Mastery debounces its writes by 400ms, so the newest answers may still be
    // in its memory and not yet in localStorage -- which is where the envelope
    // below is built from. Push it through first, or this last-chance push sends
    // a snapshot that is missing exactly the answers most at risk. Listener
    // order between modules is not guaranteed, so do not rely on mastery's own
    // pagehide handler having already run.
    try { if (window.NSTMastery && window.NSTMastery.flush) window.NSTMastery.flush(); } catch (e) {}
    var snap = snapshot();
    if (snap === state.lastPushed || !snap || snap === "{}") return;
    var body = JSON.stringify(B.envelope());
    var small = bodyBytes(body) <= KEEPALIVE_SAFE_BYTES;
    try {
      fetch("/api/progress", {
        method: "PUT", credentials: "same-origin", keepalive: small,
        headers: { "Content-Type": "application/json" },
        body: body,
      });
      // NOT marked as pushed. This request cannot be awaited -- the page is
      // going -- so its success is unknown, and a page restored from bfcache
      // would carry a false "already pushed" and skip the next real push.
      // Since a merge no longer loses anything (v2.18.0), re-sending is free.
    } catch (e) { /* nothing more we can do on the way out */ }
  }

  function start() {
    if (!window.fetch || !backup()) return Promise.resolve(false);
    return api("/api/me").then(function (me) {
      state.enabled = true;
      state.user = me;
      // Let the page render an account control. Fired only when server-backed, so
      // a static host simply never sees it.
      try { window.dispatchEvent(new CustomEvent("nst-account", { detail: me })); } catch (e) {}

      /* A different account last synced here: this browser is holding someone
       * else's study record. Clear it before anything reads or sends it.
       *
       * This does lose work that was never pushed -- someone who studied with
       * the network down and signed out without it recovering. That window is
       * narrow (a push fires every five seconds, on page-hide, and forced at
       * sign-in), and the alternative is worse in both directions: their record
       * ends up in a colleague's account, and it stays readable in a colleague's
       * browser. */
      var mine = String(me && me.id);
      var stamped = storedOwner();
      var foreign = !!stamped && stamped !== mine;
      state.switchedFrom = foreign ? stamped : null;
      if (foreign) {
        try { backup().clearLocal(); } catch (e) { /* nothing local to protect */ }
        state.lastPushed = "";
      }

      return pull().then(function (r) {
        // Anything already in this browser that the server has not seen goes up
        // straight away, so a first sign-in adopts existing local progress.
        // After a switch there is nothing local but what the pull just wrote.
        return push(true).then(function () {
          stampOwner(mine);
          return r;
        });
      });
    }).then(function () {
      // localStorage writes do not fire an event in the tab that made them, so
      // poll cheaply: a string compare of what we would send.
      setInterval(function () {
        if (state.busy) return;
        if (snapshot() !== state.lastPushed) schedulePush();
      }, 5000);
      window.addEventListener("pagehide", flushOnHide);
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "hidden") flushOnHide();
      });
      return true;
    }).catch(function () {
      // Not served from the app server (or signed out): stay dormant. This is the
      // normal path on GitHub Pages and file://, and must never be noisy.
      state.enabled = false;
      return false;
    });
  }

  window.NSTSync = {
    start: start, pull: pull, push: push, flushOnHide: flushOnHide,
    isEnabled: function () { return state.enabled; },
    status: function () {
      return { ok: state.failures < FAILURES_BEFORE_WARNING, failures: state.failures, error: state.lastError };
    },
    KEEPALIVE_SAFE_BYTES: KEEPALIVE_SAFE_BYTES,
    FAILURES_BEFORE_WARNING: FAILURES_BEFORE_WARNING,
    user: function () { return state.user; },
    OWNER_KEY: OWNER_KEY,
    storedOwner: storedOwner,
    // Null unless this load found a DIFFERENT account's record in the browser
    // and cleared it, in which case it is that account's id.
    switchedFrom: function () { return state.switchedFrom; },
    lastError: function () { return state.lastError; },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { start(); });
  } else {
    start();
  }
})();
