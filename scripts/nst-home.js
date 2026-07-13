/* Nutanix Study Tool — launcher behavior: the Settings panel.
 * Opens from the nav gear; writes NST-wide preferences via window.NSTPrefs, which
 * the home + Practice Exams honor through root classes and WWTBANE + StarNix read
 * at boot. Groups: Accessibility, Audio, Developer Mode, Reset saved data. */
(function () {
  "use strict";
  var NST_VERSION = "1.0.0";
  var P = window.NSTPrefs;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* Accessible on/off switch */
  function toggle(labelText, descText, checked, onChange) {
    var row = el("div", "nst-set-row");
    var text = el("div", "nst-set-text");
    text.appendChild(el("div", "nst-set-label", labelText));
    if (descText) text.appendChild(el("div", "nst-set-desc", descText));
    row.appendChild(text);
    var btn = el("button", "nst-switch" + (checked ? " on" : ""));
    btn.type = "button";
    btn.setAttribute("role", "switch");
    btn.setAttribute("aria-checked", checked ? "true" : "false");
    btn.setAttribute("aria-label", labelText);
    btn.appendChild(el("span", "nst-switch-thumb"));
    btn.addEventListener("click", function () {
      checked = !checked;
      btn.classList.toggle("on", checked);
      btn.setAttribute("aria-checked", checked ? "true" : "false");
      onChange(checked);
    });
    row.appendChild(btn);
    return row;
  }

  function section(title) {
    var s = el("section", "nst-set-section");
    s.appendChild(el("h3", "nst-set-title", title));
    return s;
  }

  function fmtBytes(n) { return n < 1024 ? n + " B" : (n / 1024).toFixed(1) + " KB"; }

  function diagnostics() {
    var wrap = el("div", "nst-diag");
    var prefs = P.get();
    var rows = [
      ["NST version", NST_VERSION],
      ["Reduced-motion (OS)", (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) ? "reduce" : "no-preference"],
      ["Viewport", window.innerWidth + "×" + window.innerHeight],
      ["User agent", navigator.userAgent.slice(0, 60) + "…"],
    ];
    var meta = el("div", "nst-diag-grid");
    rows.forEach(function (r) {
      meta.appendChild(el("span", "nst-diag-k", r[0]));
      meta.appendChild(el("span", "nst-diag-v", String(r[1])));
    });
    wrap.appendChild(meta);
    // localStorage inventory
    var keys = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        keys.push([k, (localStorage.getItem(k) || "").length]);
      }
    } catch (e) {}
    var ls = el("div", "nst-diag-ls");
    ls.appendChild(el("div", "nst-diag-lshead", "localStorage (" + keys.length + " keys)"));
    keys.sort().forEach(function (kv) {
      var r = el("div", "nst-diag-lsrow");
      r.appendChild(el("code", null, kv[0]));
      r.appendChild(el("span", "nst-diag-size", fmtBytes(kv[1])));
      ls.appendChild(r);
    });
    wrap.appendChild(ls);
    // raw prefs
    var pre = el("pre", "nst-diag-json", JSON.stringify(prefs, null, 2));
    wrap.appendChild(pre);
    return wrap;
  }

  function buildModal() {
    var prefs = P.get();
    var overlay = el("div", "nst-modal-overlay");
    var modal = el("div", "nst-modal");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Settings");

    var head = el("div", "nst-modal-head");
    head.appendChild(el("h2", "nst-modal-title", "Settings"));
    var x = el("button", "nst-modal-x", "✕");
    x.type = "button";
    x.setAttribute("aria-label", "Close settings");
    head.appendChild(x);
    modal.appendChild(head);

    var body = el("div", "nst-modal-body");

    // --- Accessibility ---
    var acc = section("Accessibility");
    acc.appendChild(toggle("Reduced motion", "Minimize animations and transitions everywhere.", prefs.reducedMotion, function (v) { P.set({ reducedMotion: v }); }));
    acc.appendChild(toggle("High contrast", "Stronger text and border contrast.", prefs.highContrast, function (v) { P.set({ highContrast: v }); }));
    acc.appendChild(toggle("Larger text", "Increase the base text size for readability.", prefs.largerText, function (v) { P.set({ largerText: v }); }));
    body.appendChild(acc);

    // --- Audio ---
    var aud = section("Audio");
    aud.appendChild(el("p", "nst-set-note", "Applies to the WWTBANE and StarNix games (the launcher and Practice Exams are silent)."));
    aud.appendChild(toggle("Mute all", "Silence game audio.", prefs.audioMuted, function (v) { P.set({ audioMuted: v }); }));
    var volRow = el("div", "nst-set-row");
    var volText = el("div", "nst-set-text");
    volText.appendChild(el("div", "nst-set-label", "Volume"));
    volRow.appendChild(volText);
    var vol = el("input", "nst-slider");
    vol.type = "range"; vol.min = "0"; vol.max = "100"; vol.step = "5";
    vol.value = String(Math.round(prefs.audioVolume * 100));
    vol.setAttribute("aria-label", "Volume");
    var volVal = el("span", "nst-slider-val", vol.value + "%");
    vol.addEventListener("input", function () { volVal.textContent = vol.value + "%"; P.set({ audioVolume: Number(vol.value) / 100 }); });
    volRow.appendChild(vol);
    volRow.appendChild(volVal);
    aud.appendChild(volRow);
    body.appendChild(aud);

    // --- Developer Mode ---
    var dev = section("Developer Mode");
    var devPanelHost = el("div", "nst-dev-host");
    function renderDevPanel(on) { devPanelHost.innerHTML = ""; if (on) devPanelHost.appendChild(diagnostics()); }
    dev.appendChild(toggle("Enable developer mode", "Show build info and diagnostics; unlocks each tool's debug affordances.", prefs.devMode, function (v) { P.set({ devMode: v }); renderDevPanel(v); }));
    dev.appendChild(devPanelHost);
    renderDevPanel(prefs.devMode);
    body.appendChild(dev);

    // --- Reset ---
    var reset = section("Reset saved data");
    reset.appendChild(el("p", "nst-set-note", "Clears preferences, Practice Exams history, and WWTBANE/StarNix progress on this device."));
    var resetBtn = el("button", "nst-btn nst-btn-danger", "Reset saved data…");
    resetBtn.type = "button";
    resetBtn.addEventListener("click", function () { confirmReset(overlay); });
    reset.appendChild(resetBtn);
    body.appendChild(reset);

    modal.appendChild(body);
    overlay.appendChild(modal);

    function close() { try { overlay.remove(); } catch (e) {} document.removeEventListener("keydown", onKey); }
    function onKey(e) { if (e.key === "Escape") close(); }
    x.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);

    document.body.appendChild(overlay);
    x.focus();
  }

  function confirmReset(settingsOverlay) {
    var overlay = el("div", "nst-modal-overlay nst-modal-overlay-top");
    var modal = el("div", "nst-modal nst-modal-sm");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.appendChild(el("h3", "nst-modal-title", "Reset all saved data?"));
    modal.appendChild(el("p", "nst-modal-body-text", "This permanently clears your NST preferences, Practice Exams attempt history, and WWTBANE/StarNix game progress stored in this browser. This cannot be undone."));
    var row = el("div", "nst-modal-actions");
    var cancel = el("button", "nst-btn nst-btn-ghost", "Cancel");
    cancel.type = "button";
    var ok = el("button", "nst-btn nst-btn-danger", "Reset everything");
    ok.type = "button";
    function close() { try { overlay.remove(); } catch (e) {} }
    cancel.addEventListener("click", close);
    ok.addEventListener("click", function () {
      try {
        var kill = [];
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (/^nst\.|^starnix:|^wwtbane\./.test(k)) kill.push(k);
        }
        kill.forEach(function (k) { localStorage.removeItem(k); });
      } catch (e) {}
      if (window.NSTPrefs) window.NSTPrefs.apply(window.NSTPrefs.DEFAULTS);
      window.location.reload();
    });
    row.appendChild(cancel); row.appendChild(ok);
    modal.appendChild(row);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    ok.focus();
  }

  function init() {
    var btn = document.getElementById("nst-settings-btn");
    if (btn) btn.addEventListener("click", buildModal);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
