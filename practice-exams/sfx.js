/* Nutanix Practice Exams — feedback sounds (opt-in).
 * Tiny synthesized WebAudio cues, OFF by default: they play only when the user turns
 * on "Practice Exams sounds" in NST Settings (nst.prefs.peSound) AND global audio
 * isn't muted (nst.prefs.audioMuted). Volume follows nst.prefs.audioVolume, scaled
 * well below music level. No assets, no loops — a context is created lazily on the
 * first (user-gesture-driven) play and every gain is capped to prevent clipping. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var ctx = null;

  function prefs() {
    try { return window.NSTPrefs ? window.NSTPrefs.get() : {}; } catch (e) { return {}; }
  }
  function enabled() {
    var p = prefs();
    return p.peSound === true && p.audioMuted !== true;
  }
  function level() {
    var v = prefs().audioVolume;
    v = (typeof v === "number" && v >= 0 && v <= 1) ? v : 0.7;
    return v * 0.35;   // (S9) feedback cues sit well under music level; hard cap
  }
  function ac() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }

  // One enveloped oscillator note. All gains pass through a shared cap.
  function tone(c, t0, freq, dur, type, gain) {
    var o = c.createOscillator(), g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, t0);
    var peak = Math.min(0.5, (gain || 0.5)) * level();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, peak), t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(c.destination);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  var CUES = {
    select: function (c, t) { tone(c, t, 660, 0.06, "triangle", 0.35); },
    flag: function (c, t) { tone(c, t, 440, 0.05, "square", 0.25); tone(c, t + 0.07, 520, 0.05, "square", 0.25); },
    correct: function (c, t) { tone(c, t, 523, 0.09, "sine", 0.45); tone(c, t + 0.09, 784, 0.14, "sine", 0.45); },
    incorrect: function (c, t) { tone(c, t, 220, 0.16, "sawtooth", 0.28); tone(c, t + 0.02, 208, 0.16, "sawtooth", 0.22); },
    submit: function (c, t) { tone(c, t, 392, 0.08, "triangle", 0.35); tone(c, t + 0.09, 494, 0.08, "triangle", 0.35); tone(c, t + 0.18, 587, 0.12, "triangle", 0.35); },
    pass: function (c, t) { [523, 659, 784, 1047].forEach(function (f, i) { tone(c, t + i * 0.11, f, 0.22, "sine", 0.45); }); },
    fail: function (c, t) { [392, 330, 262].forEach(function (f, i) { tone(c, t + i * 0.14, f, 0.2, "sine", 0.35); }); },
  };

  PE.sfx = {
    enabled: enabled,
    play: function (name) {
      if (!enabled() || !CUES[name]) return;
      var c = ac();
      if (!c) return;
      try { CUES[name](c, c.currentTime); } catch (e) { /* audio is never load-bearing */ }
    },
  };
})();
