/* Nutanix Study Tool — shared preferences.
 * A single source of truth (localStorage "nst.prefs") for NST-wide settings that
 * every tool honors: accessibility (reduced motion / high contrast / larger text),
 * audio (mute + volume), and developer mode.
 *
 * The launcher and Practice Exams include this file and respond to the root
 * classes it sets. WWTBANE and StarNix read "nst.prefs" directly at boot and map
 * it onto their own settings. Loaded early (in <head>) so classes apply before paint. */
(function () {
  "use strict";
  var KEY = "nst.prefs";
  var DEFAULTS = {
    reducedMotion: false,
    highContrast: false,
    largerText: false,
    audioMuted: false,
    audioVolume: 0.7,   // 0..1
    devMode: false,
  };

  function read() {
    try { return Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem(KEY)) || {}); }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function write(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} }

  function applyDoc(p) {
    p = p || read();
    var r = document.documentElement;
    if (!r) return;
    r.classList.toggle("nst-reduced-motion", !!p.reducedMotion);
    r.classList.toggle("nst-high-contrast", !!p.highContrast);
    r.classList.toggle("nst-larger-text", !!p.largerText);
    r.classList.toggle("nst-dev", !!p.devMode);
  }

  window.NSTPrefs = {
    KEY: KEY,
    DEFAULTS: DEFAULTS,
    get: read,
    set: function (patch) {
      var p = Object.assign(read(), patch || {});
      write(p);
      applyDoc(p);
      return p;
    },
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
      applyDoc(Object.assign({}, DEFAULTS));
    },
    apply: applyDoc,
  };

  applyDoc();
})();
