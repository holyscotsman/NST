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
    lastError: null, busy: false,
  };

  function backup() { return window.NSTBackup || null; }

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
   * not silently lose that by opening the page. */
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
      .then(function (r) { state.lastPushed = snap; state.lastError = null; return { ok: true, at: r.updatedAt }; })
      .catch(function (e) { state.lastError = e.message; return { ok: false, error: e.message }; })
      .then(function (r) { state.busy = false; return r; });
  }

  function schedulePush() {
    if (!state.enabled) return;
    if (state.pushTimer) clearTimeout(state.pushTimer);
    state.pushTimer = setTimeout(function () { state.pushTimer = null; push(false); }, PUSH_DEBOUNCE_MS);
  }

  /* A last-chance push as the tab goes away. keepalive lets the browser finish
   * the request after the page is gone, which a normal fetch would not survive. */
  function flushOnHide() {
    var B = backup();
    if (!B || !state.enabled) return;
    var snap = snapshot();
    if (snap === state.lastPushed || !snap || snap === "{}") return;
    try {
      fetch("/api/progress", {
        method: "PUT", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(B.envelope()),
      });
      state.lastPushed = snap;
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
      return pull().then(function (r) {
        // Anything already in this browser that the server has not seen goes up
        // straight away, so a first sign-in adopts existing local progress.
        return push(true).then(function () { return r; });
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
    user: function () { return state.user; },
    lastError: function () { return state.lastError; },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { start(); });
  } else {
    start();
  }
})();
