/* Nutanix Study Tool — progress backup (window.NSTBackup).
 *
 * Everything NST knows about you lives in this browser's localStorage: mastery
 * history built over weeks, exam attempts, game saves, preferences. There is no
 * account and no server, which is the point — but it also means "Clear browsing
 * data" erases months of work with no way back. This module is that way back: it
 * writes a plain JSON file you keep, and reads it again on any device.
 *
 * Why not SQLite/OPFS/IndexedDB? They are all the *same* storage bucket the
 * browser clears together — a different API over identical fragility, for ~1 MB
 * of WASM and a weaker CSP. Durability comes from getting the data OUT of the
 * origin, which is what a downloaded file does.
 *
 * IMPORTANT — the origin is shared. A github.io user page is ONE origin for
 * every project published under it, so localStorage here is shared with the
 * owner's other sites. Export therefore takes only keys NST owns, and import
 * refuses to write anything outside that set: a hand-edited or hostile backup
 * file must not be able to reach a neighbouring project's data.
 */
(function () {
  "use strict";

  var FORMAT = 1;                       // bump when the envelope shape changes
  var APP = "nutanix-study-tool";
  // Every key NST owns, by exact name or prefix. Nothing else is ever read or written.
  var OWNED_PREFIXES = ["nst.", "starnix:", "wwtbane."];

  /* ...minus the bookkeeping that describes THIS BROWSER rather than the study.
   *
   * `nst.sync.owner` (v2.60.0) records which account last synced here, so that
   * signing in as someone else clears their colleague's record instead of
   * merging it. It is per-browser by definition and must not travel:
   *
   *   - restoring a backup would overwrite the local stamp with whichever
   *     browser last pushed, and two devices would then trade stamps and clear
   *     each other's progress -- the exact thing the stamp exists to prevent;
   *   - and because the stamp is written just AFTER a push, including it made
   *     every push's snapshot immediately stale, which silently threw away the
   *     compressed body the page-hide push depends on.
   *
   * Anything here is read and written normally by the app; it is only invisible
   * to backup, restore and sync. */
  var LOCAL_ONLY = ["nst.sync.owner"];
  var MAX_VALUE_BYTES = 8 * 1024 * 1024;   // a single value this large is not ours
  var MAX_TOTAL_BYTES = 16 * 1024 * 1024;

  function ls() { try { return window.localStorage; } catch (e) { return null; } }

  function isOwned(key) {
    if (typeof key !== "string" || !key) return false;
    for (var j = 0; j < LOCAL_ONLY.length; j++) {
      if (key === LOCAL_ONLY[j]) return false;
    }
    for (var i = 0; i < OWNED_PREFIXES.length; i++) {
      if (key.indexOf(OWNED_PREFIXES[i]) === 0) return true;
    }
    return false;
  }

  /* Gather every NST-owned key/value pair currently in storage. */
  function collect() {
    var s = ls(), out = {};
    if (!s) return out;
    try {
      for (var i = 0; i < s.length; i++) {
        var k = s.key(i);
        if (!isOwned(k)) continue;
        var v = s.getItem(k);
        if (typeof v === "string") out[k] = v;
      }
    } catch (e) { /* storage unavailable mid-read; return what we have */ }
    return out;
  }

  /* A short human summary so the UI can say what is in the file. */
  function summarize(data) {
    var out = { keys: 0, bytes: 0, tools: [] };
    var seen = {};
    for (var k in data) {
      if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
      out.keys++;
      out.bytes += k.length + String(data[k]).length;
      var tool = k.indexOf("starnix:") === 0 ? "StarNix"
        : k.indexOf("wwtbane.") === 0 ? "WWTBANE"
          : k.indexOf("nst.practice-exams") === 0 ? "Practice Exams" : "Settings";
      if (!seen[tool]) { seen[tool] = 1; out.tools.push(tool); }
    }
    return out;
  }

  function envelope() {
    var data = collect();
    return {
      app: APP,
      format: FORMAT,
      appVersion: (window.NST_VERSION || "unknown"),
      exportedAt: new Date().toISOString(),
      summary: summarize(data),
      data: data,
    };
  }

  function toJSON() { return JSON.stringify(envelope(), null, 2); }

  function filename() {
    var d = new Date();
    function p(n) { return (n < 10 ? "0" : "") + n; }
    return "nst-progress-" + d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + ".json";
  }

  /* Hand the file to the browser. Uses a blob URL + <a download>, which a strict
   * CSP permits (a download is not a fetch or a navigation). */
  function download() {
    var json = toJSON();
    var url = null;
    try {
      var blob = new Blob([json], { type: "application/json" });
      url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url; a.download = filename();
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { ok: true, bytes: json.length, name: a.download };
    } catch (e) {
      return { ok: false, error: e && e.message ? e.message : String(e) };
    } finally {
      // Revoke on the next turn so the download has begun.
      if (url) setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e2) {} }, 30000);
    }
  }

  /* Parse + validate a backup file. Returns {ok, data|error}. Never writes. */
  function inspect(text) {
    var parsed;
    try {
      // (as elsewhere in NST) a stored/loaded blob must not reshape a prototype
      parsed = JSON.parse(text, function (k, v) { return k === "__proto__" ? undefined : v; });
    } catch (e) { return { ok: false, error: "That file isn't valid JSON." }; }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { ok: false, error: "That file isn't an NST backup." };
    }
    if (parsed.app !== APP) return { ok: false, error: "That file isn't an NST backup." };
    if (typeof parsed.format !== "number" || parsed.format > FORMAT) {
      return { ok: false, error: "That backup was made by a newer version of NST. Update, then try again." };
    }
    var data = parsed.data;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, error: "That backup has no progress data in it." };
    }
    var clean = {}, total = 0, rejected = 0, kept = 0;
    for (var k in data) {
      if (!Object.prototype.hasOwnProperty.call(data, k)) continue;
      var v = data[k];
      // The origin is shared with the owner's other GitHub Pages sites: only ever
      // restore keys NST itself owns, whatever the file claims.
      if (!isOwned(k) || typeof v !== "string" || v.length > MAX_VALUE_BYTES) { rejected++; continue; }
      total += k.length + v.length;
      if (total > MAX_TOTAL_BYTES) { rejected++; continue; }
      clean[k] = v; kept++;
    }
    if (!kept) return { ok: false, error: "That backup didn't contain any NST progress." };
    return {
      ok: true,
      exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : null,
      appVersion: typeof parsed.appVersion === "string" ? parsed.appVersion : null,
      rejected: rejected,
      summary: summarize(clean),
      data: clean,
    };
  }

  /* Per-key merge strategies.
   *
   * "merge" used to mean only "do not delete keys the incoming copy lacks" --
   * within a key the incoming value still won outright. That is silent data loss
   * for the two keys that matter, because each is a single value holding
   * EVERYTHING: all mastery lives in one key, and all exam attempts in another.
   * Two devices, or a restore over existing progress, and one side's work simply
   * vanished.
   *
   * Anything not listed here (preferences, the resume position) is genuinely
   * last-writer-wins, which is what those mean.
   */

  /* Exam attempts: an array, newest first. The union, de-duplicated on the
   * fields that identify an attempt, re-sorted, and capped the way the engine
   * caps it. */
  function mergeAttempts(currentText, incomingText) {
    function listOf(t) {
      if (!t) return [];
      try {
        // Parsed here rather than through a helper from another file: this
        // module must work wherever it is loaded, with or without its siblings.
        var v = JSON.parse(String(t), function (k, val) { return k === "__proto__" ? undefined : val; });
        return Array.isArray(v) ? v : [];
      } catch (e) { return []; }
    }
    var all = listOf(currentText).concat(listOf(incomingText));
    var seen = {}, out = [];
    for (var i = 0; i < all.length; i++) {
      var a = all[i];
      if (!a || typeof a !== "object") continue;
      var key = [a.at, a.pct, a.total, a.correct].join("|");
      if (seen[key]) continue;
      seen[key] = 1;
      out.push(a);
    }
    out.sort(function (x, y) { return (Number(y && y.at) || 0) - (Number(x && x.at) || 0); });
    return JSON.stringify(out.slice(0, 50));
  }

  /* Looked up lazily: nst-backup.js loads before nst-mastery.js, so the module
   * is not there yet at definition time -- only at restore time. If it is
   * somehow missing, fall back to the old behaviour rather than failing. */
  function mergeValue(key, currentText, incomingText) {
    if (key === "nst.mastery.v1") {
      var M = window.NSTMastery;
      if (M && M.mergeSerialized) return M.mergeSerialized(currentText, incomingText);
      return incomingText;
    }
    if (key === "nst.practice-exams.history.v1") return mergeAttempts(currentText, incomingText);
    return incomingText;
  }

  /* Write a validated backup into storage.
   * mode "replace" clears NST's existing keys first; "merge" combines with what
   * is already here -- per value for the keys that hold everything, see
   * mergeValue above. Either way, only owned keys are ever written. */
  function restore(text, opts) {
    var chk = inspect(text);
    if (!chk.ok) return chk;
    var s = ls();
    if (!s) return { ok: false, error: "This browser isn't allowing local storage." };
    var mode = (opts && opts.mode) === "merge" ? "merge" : "replace";

    // Safety net: if the write fails part-way, put back what was there.
    var previous = collect();
    try {
      if (mode === "replace") {
        for (var old in previous) {
          if (Object.prototype.hasOwnProperty.call(previous, old)) s.removeItem(old);
        }
      }
      for (var k in chk.data) {
        if (!Object.prototype.hasOwnProperty.call(chk.data, k)) continue;
        // In merge mode the keys that hold everything are combined value-by-value
        // rather than overwritten -- see mergeValue above.
        var value = (mode === "merge")
          ? mergeValue(k, previous[k], chk.data[k])
          : chk.data[k];
        s.setItem(k, value);
      }
    } catch (e) {
      try {
        for (var r in previous) {
          if (Object.prototype.hasOwnProperty.call(previous, r)) s.setItem(r, previous[r]);
        }
      } catch (e2) { /* nothing more we can do */ }
      var msg = (e && e.name === "QuotaExceededError")
        ? "There isn't enough browser storage left to restore that backup."
        : "Restore failed, so nothing was changed.";
      return { ok: false, error: msg };
    }
    // Anything holding this data in memory is now stale. NSTMastery caches the
    // parsed store and writes it back on its next save, so without this a
    // debounced save from before the restore would put the OLD records back over
    // the merged ones -- losing exactly what the merge just rescued.
    try {
      var M = window.NSTMastery;
      if (M && M.load) M.load(true);
    } catch (e) { /* the restore itself succeeded; this is a cache hint */ }

    return { ok: true, restored: chk.summary, mode: mode, rejected: chk.rejected };
  }

  /* Remove every key this app owns, and nothing else.
   *
   * The account-switch path needs this and `restore("...", {mode:"replace"})`
   * cannot provide it: replace only clears keys on its way to writing new ones,
   * so against a brand-new account -- which has nothing stored -- `pull()`
   * returns "nothing stored yet" and writes nothing, and the previous person's
   * record survives in the browser. The next push then sends it up under the new
   * name. See NSTSync.start. */
  function clearLocal() {
    var s = ls();
    if (!s) return { ok: false, cleared: 0, error: "This browser isn't allowing local storage." };
    var previous = collect();
    var n = 0;
    try {
      for (var k in previous) {
        if (Object.prototype.hasOwnProperty.call(previous, k)) { s.removeItem(k); n++; }
      }
    } catch (e) {
      return { ok: false, cleared: n, error: "Local progress could not be cleared." };
    }
    // Same reason restore() does this: NSTMastery caches the parsed store and
    // writes it back on its next save, so without the reload a debounced save
    // from before the clear would put every record straight back.
    try {
      var M = window.NSTMastery;
      if (M && M.load) M.load(true);
    } catch (e) { /* the clear itself succeeded; this is a cache hint */ }
    return { ok: true, cleared: n };
  }

  /* How much storage we are using, and how close to the ceiling. */
  function estimate() {
    var ours = summarize(collect());
    if (!navigator.storage || !navigator.storage.estimate) {
      return Promise.resolve({ ours: ours.bytes, usage: null, quota: null, pct: null });
    }
    return navigator.storage.estimate().then(function (e) {
      var usage = e && e.usage || 0, quota = e && e.quota || 0;
      return { ours: ours.bytes, usage: usage, quota: quota, pct: quota ? (usage / quota) * 100 : null };
    }).catch(function () {
      return { ours: ours.bytes, usage: null, quota: null, pct: null };
    });
  }

  /* Ask the browser to exempt this origin from automatic eviction. Does not stop
   * a manual "clear browsing data" — only a downloaded file survives that. */
  function requestPersist() {
    if (!navigator.storage || !navigator.storage.persist) return Promise.resolve(false);
    return navigator.storage.persisted().then(function (already) {
      return already ? true : navigator.storage.persist();
    }).catch(function () { return false; });
  }

  window.NSTBackup = {
    FORMAT: FORMAT,
    APP: APP,
    OWNED_PREFIXES: OWNED_PREFIXES,
    LOCAL_ONLY: LOCAL_ONLY,
    mergeValue: mergeValue, mergeAttempts: mergeAttempts,
    isOwned: isOwned,
    collect: collect,
    summarize: summarize,
    envelope: envelope,
    toJSON: toJSON,
    filename: filename,
    download: download,
    inspect: inspect,
    restore: restore,
    clearLocal: clearLocal,
    estimate: estimate,
    requestPersist: requestPersist,
  };
})();
