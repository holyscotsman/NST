/* Nutanix Study Tool — launcher behavior: the Settings panel.
 * Opens from the nav gear; writes NST-wide preferences via window.NSTPrefs, which
 * the home + Practice Exams honor through root classes and WWTBANE + StarNix read
 * at boot. Groups: Accessibility, Audio, Developer Mode, Reset saved data. */
(function () {
  "use strict";
  var NST_VERSION = "1.1.0";
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

  // Question-bank picker section (async — the manifest is fetched).
  function buildBankSection() {
    var s = section("Question bank");
    s.appendChild(el("p", "nst-set-note", "The tools load questions from the active bank at runtime — nothing is baked in. Add banks to /banks/ (see banks/README.md)."));
    var list = el("div", "nst-bank-list");
    list.appendChild(el("div", "nst-set-note", "Loading…"));
    s.appendChild(list);
    var Bank = window.NSTBank;
    if (!Bank) { list.innerHTML = ""; list.appendChild(el("div", "nst-bank-empty", "Bank loader unavailable.")); return s; }
    Bank.list().then(function (banks) {
      list.innerHTML = "";
      if (!banks.length) {
        list.appendChild(el("div", "nst-bank-empty", "No question banks found. Drop a Markdown bank into /banks/, list it in manifest.json, then reload."));
        return;
      }
      var applyHint = el("p", "nst-set-note nst-bank-apply", "Selected — reopen a tool to load it.");
      applyHint.style.display = "none";
      var activeId = Bank.active() || "";
      var choices = [{ id: "", cert: "None", title: "No bank (tools stay empty)" }].concat(banks);
      choices.forEach(function (b) {
        var on = (b.id || "") === activeId;
        var row = el("label", "nst-bank-row" + (on ? " on" : ""));
        var r = el("input"); r.type = "radio"; r.name = "nst-bank"; r.checked = on;
        r.addEventListener("change", function () {
          Bank.setActive(b.id || null);
          [].forEach.call(list.querySelectorAll(".nst-bank-row"), function (x) { x.classList.remove("on"); });
          row.classList.add("on");
          applyHint.style.display = "";
          if (_certRefresh) _certRefresh();   // (UI) hero buttons + nav badge stay in sync
        });
        row.appendChild(r);
        var txt = el("div", "nst-bank-rowtext");
        txt.appendChild(el("div", "nst-bank-rowtitle", esc(b.title || b.cert || b.id)));
        if (b.id) txt.appendChild(el("div", "nst-bank-rowsub", esc(b.cert || "") + (b.count ? " · " + b.count + " questions" : "")));
        row.appendChild(txt);
        list.appendChild(row);
      });
      list.appendChild(applyHint);
    });
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  // Question-bank chooser on the hero: one button per bank in banks/manifest.json.
  // Clicking a button writes nst.activeBank (via NSTBank.setActive); every tool reads it
  // at boot. Adding a bank to the manifest adds a button here — no code change needed.
  var _navBadgeUpdate = null;   // set by renderNavBadge; called when the active bank changes
  var _certRefresh = null;      // set by the hero chooser; re-syncs its buttons + the badge

  function renderCertSelector() {
    var Bank = window.NSTBank; if (!Bank) return;
    var host = document.querySelector(".nst-hero"); if (!host) return;

    var wrap = el("div", "nst-cert");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Question bank");
    wrap.appendChild(el("div", "nst-cert-label", "Question bank"));
    var group = el("div", "nst-cert-btns");
    var hint = el("span", "nst-cert-hint", "");
    wrap.appendChild(group);
    wrap.appendChild(hint);
    host.appendChild(wrap);

    function populate(banks) {
      group.innerHTML = "";
      // Manifest fetch failed (offline / bad deploy): say so and offer a real retry
      // instead of pretending there are no banks.
      if (!banks.length && Bank.manifestError && Bank.manifestError()) {
        wrap.classList.add("empty");
        group.appendChild(el("div", "nst-cert-empty", "Couldn't load the question banks — check your connection."));
        var retry = el("button", "nst-cert-btn", "Retry");
        retry.type = "button";
        retry.addEventListener("click", function () {
          group.innerHTML = "";
          group.appendChild(el("div", "nst-cert-loading", "Loading banks…"));
          Bank.manifest(true).then(populate);
        });
        group.appendChild(retry);
        hint.textContent = "";
        return;
      }
      if (!banks.length) {
        wrap.classList.add("empty");
        group.appendChild(el("div", "nst-cert-empty", "No question banks yet. Add one to /banks/."));
        hint.textContent = "";
        return;
      }
      function refresh() {
        var active = Bank.active() || "";
        [].forEach.call(group.querySelectorAll(".nst-cert-btn"), function (btn) {
          var on = btn.getAttribute("data-id") === active;
          btn.classList.toggle("on", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        var b = banks.filter(function (x) { return x.id === active; })[0];
        hint.textContent = b ? (b.title || b.cert || b.id) + " — open a tool below to study it."
                             : "Pick a question bank to load its questions.";
        wrap.classList.toggle("empty", !b);
        if (_navBadgeUpdate) _navBadgeUpdate(b || null);
      }
      banks.forEach(function (b) {
        var btn = el("button", "nst-cert-btn", esc(b.title || b.cert || b.id));
        btn.type = "button";
        btn.setAttribute("data-id", b.id);
        btn.addEventListener("click", function () { Bank.setActive(b.id); refresh(); });
        group.appendChild(btn);
      });
      _certRefresh = refresh;   // (UI) Settings' bank section calls this to stay in sync
      refresh();
    }

    group.appendChild(el("div", "nst-cert-loading", "Loading banks…"));
    Bank.list().then(populate);
  }

  // Small nav chip showing the active bank at a glance; clicking scrolls to the chooser.
  function renderNavBadge() {
    var Bank = window.NSTBank; if (!Bank) return;
    var utils = document.querySelector(".nst-nav-utils"); if (!utils) return;
    var chip = el("button", "nst-nav-bank", "");
    chip.type = "button";
    chip.title = "Question bank — click to choose";
    chip.addEventListener("click", function () {
      var t = document.querySelector(".nst-cert");
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    utils.insertBefore(chip, utils.firstChild);
    _navBadgeUpdate = function (bank) {
      chip.textContent = bank ? (bank.cert || bank.id) : "No bank";
      chip.classList.toggle("none", !bank);
    };
    _navBadgeUpdate(null);
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

    // --- Question bank ---
    body.appendChild(buildBankSection());

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
    renderNavBadge();
    renderCertSelector();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
