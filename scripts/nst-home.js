/* Nutanix Study Tool — launcher behavior: the Settings panel.
 * Opens from the nav gear; writes NST-wide preferences via window.NSTPrefs, which
 * the home + Practice Exams honor through root classes and WWTBANE + StarNix read
 * at boot. Groups: Accessibility, Audio, Developer Mode, Reset saved data. */
(function () {
  "use strict";
  var NST_VERSION = window.NST_VERSION || "dev";   // (C6-08) single source: shared/nst-version.js
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
    // (C1-02) named renderer so the failure branch's Retry can re-fetch and
    // re-render in place — a fetch failure is an ERROR with a Retry, never the
    // misleading "no banks found" empty state.
    function render(banks) {
      list.innerHTML = "";
      if (!banks.length && Bank.manifestError && Bank.manifestError()) {
        list.appendChild(el("div", "nst-bank-empty", "Couldn't load the question banks — check your connection."));
        var retry = el("button", "nst-btn nst-btn-ghost", "Retry");
        retry.type = "button";
        retry.addEventListener("click", function () {
          list.innerHTML = "";
          list.appendChild(el("div", "nst-set-note", "Loading…"));
          Bank.manifest(true).then(function (banks2) {
            render(banks2);
            // re-render destroyed the focused Retry — keep focus inside the modal
            var f = list.querySelector("input, button");
            if (f) f.focus();
          });
        });
        list.appendChild(retry);
        return;
      }
      if (!banks.length) {
        list.appendChild(el("div", "nst-bank-empty", "No question banks found. Drop a Markdown bank into /banks/, list it in manifest.json, then reload."));
        return;
      }
      var applyHint = el("p", "nst-set-note nst-bank-apply", "Selected — reopen a tool to load it.");
      applyHint.setAttribute("aria-live", "polite");   // (C4-02)
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
    }
    Bank.list().then(render);
    return s;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]; }); }

  // Exam chooser on the hero: one tile per Nutanix cert from banks/manifest.json's
  // `certs` list. A populated cert offers a "25 questions" and a "Full bank" button,
  // each of which writes nst.activeBank (via NSTBank.setActive); every tool reads it
  // at boot. Certs marked comingSoon (no questions yet) render as disabled tiles.
  var _navBadgeUpdate = null;   // set by renderNavBadge; called when the active bank changes
  var _certRefresh = null;      // set by the hero chooser; re-syncs its tiles + the badge

  var VARIANT_LABEL = { "25": "25 questions", "full": "Full bank" };

  function renderCertSelector() {
    var Bank = window.NSTBank; if (!Bank) return;
    var host = document.querySelector(".nst-hero"); if (!host) return;

    var wrap = el("div", "nst-cert");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Certification exam");
    wrap.appendChild(el("div", "nst-cert-label", "Choose your exam"));
    var grid = el("div", "nst-certgrid");
    var hint = el("span", "nst-cert-hint", "");
    hint.setAttribute("aria-live", "polite");   // (C4-02) SRs hear bank-selection feedback
    wrap.appendChild(grid);
    wrap.appendChild(hint);
    host.appendChild(wrap);

    function populate(certs) {
      grid.innerHTML = "";
      // Manifest fetch failed (offline / bad deploy): say so and offer a real retry.
      if (!certs.length && Bank.manifestError && Bank.manifestError()) {
        wrap.classList.add("empty");
        grid.appendChild(el("div", "nst-cert-empty", "Couldn't load the exams — check your connection."));
        var retry = el("button", "nst-certvar", "Retry");
        retry.type = "button";
        retry.addEventListener("click", function () {
          grid.innerHTML = "";
          grid.appendChild(el("div", "nst-cert-loading", "Loading exams…"));
          Bank.manifest(true).then(function () { Bank.certs().then(populate); });
        });
        grid.appendChild(retry);
        hint.textContent = "";
        return;
      }
      if (!certs.length) {
        wrap.classList.add("empty");
        grid.appendChild(el("div", "nst-cert-empty", "No exams yet. Add certs to /banks/manifest.json."));
        hint.textContent = "";
        return;
      }

      // Which cert + variant owns a given active bank id.
      function ownerOf(activeId) {
        for (var i = 0; i < certs.length; i++) {
          var c = certs[i]; if (!c.banks) continue;
          if (c.banks["25"] === activeId) return { cert: c, variant: "25" };
          if (c.banks.full === activeId) return { cert: c, variant: "full" };
        }
        return null;
      }

      function refresh() {
        var active = Bank.active() || "";
        var own = ownerOf(active);
        [].forEach.call(grid.querySelectorAll(".nst-certvar"), function (btn) {
          var on = btn.getAttribute("data-id") === active;
          btn.classList.toggle("on", on);
          btn.setAttribute("aria-pressed", on ? "true" : "false");
        });
        [].forEach.call(grid.querySelectorAll(".nst-certtile"), function (tile) {
          tile.classList.toggle("active", !!tile.querySelector(".nst-certvar.on"));
        });
        wrap.classList.toggle("empty", !own);
        // A synthetic bank-like object for the nav badge (cert + variant).
        var badge = own ? { cert: own.cert.code, id: active,
          title: own.cert.code + " · " + VARIANT_LABEL[own.variant] } : null;
        if (_navBadgeUpdate) _navBadgeUpdate(badge);
        if (own) {
          hint.textContent = own.cert.code + " · " + VARIANT_LABEL[own.variant] + " — loading…";
          // (C4-01) load the selected bank NOW: real question count, warmed cache,
          // and a broken bank fails loudly here instead of as an empty tool.
          Bank.load(active).then(function (loaded) {
            if ((Bank.active() || "") !== active) return;   // stale — selection moved on
            if (loaded && loaded.count) {
              hint.textContent = own.cert.code + " · " + loaded.count + " questions loaded — open a tool below to study it.";
            } else {
              hint.textContent = "Couldn't load this bank — it may be missing or malformed.";
            }
          }).catch(function () {
            if ((Bank.active() || "") === active) hint.textContent = "Couldn't load this bank — check your connection and re-select it.";
          });
        } else {
          hint.textContent = "Pick an exam and question set to begin.";
        }
      }

      function mkVariant(cert, key) {
        var b = el("button", "nst-certvar", VARIANT_LABEL[key]);
        b.type = "button";
        b.setAttribute("data-id", cert.banks[key]);
        b.setAttribute("aria-label", cert.code + " " + VARIANT_LABEL[key]);
        b.addEventListener("click", function () { Bank.setActive(cert.banks[key]); refresh(); });
        return b;
      }

      certs.forEach(function (c) {
        var tile = el("div", "nst-certtile");
        var head = el("div", "nst-certtile-head");
        head.appendChild(el("span", "nst-certtile-code", esc(c.code || "")));
        if (c.name) head.appendChild(el("span", "nst-certtile-name", esc(c.name)));
        tile.appendChild(head);
        var playable = c.banks && !c.comingSoon;
        if (playable) {
          var vars = el("div", "nst-certtile-variants");
          if (c.banks["25"]) vars.appendChild(mkVariant(c, "25"));
          if (c.banks.full) vars.appendChild(mkVariant(c, "full"));
          tile.appendChild(vars);
        } else {
          tile.classList.add("coming");
          tile.setAttribute("aria-disabled", "true");
          tile.appendChild(el("span", "nst-certtile-badge", "Coming soon"));
        }
        grid.appendChild(tile);
      });
      _certRefresh = refresh;   // (UI) Settings' bank section calls this to stay in sync
      refresh();
    }

    grid.appendChild(el("div", "nst-cert-loading", "Loading exams…"));
    Bank.certs().then(populate);
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
      // (C4-02) the bare cert text lacks context for SR users
      chip.setAttribute("aria-label", "Question bank: " + (bank ? (bank.title || bank.cert || bank.id) : "none selected") + " — choose");
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
    aud.appendChild(el("p", "nst-set-note", "Applies to the WWTBANE and StarNix games. Practice Exams stays silent unless you opt in below."));
    // (C2-08) standard mixer behavior: while Mute all is on, the controls it
    // overrides dim and disable — values are kept so unmuting restores them.
    var peRow, volRow, vol;
    function applyMuteState(muted) {
      if (vol) vol.disabled = muted;
      if (peRow) {
        peRow.classList.toggle("muted", muted);
        var sw = peRow.querySelector(".nst-switch");
        if (sw) sw.setAttribute("aria-disabled", muted ? "true" : "false");
      }
      if (volRow) volRow.classList.toggle("muted", muted);
    }
    aud.appendChild(toggle("Mute all", "Silence all audio, including Practice Exams sounds.", prefs.audioMuted, function (v) { P.set({ audioMuted: v }); applyMuteState(v); }));
    peRow = toggle("Practice Exams sounds", "Subtle feedback cues (select, correct/incorrect, submit). Off by default.", prefs.peSound, function (v) { P.set({ peSound: v }); });
    aud.appendChild(peRow);
    volRow = el("div", "nst-set-row");
    var volText = el("div", "nst-set-text");
    volText.appendChild(el("div", "nst-set-label", "Volume"));
    volRow.appendChild(volText);
    vol = el("input", "nst-slider");
    vol.type = "range"; vol.min = "0"; vol.max = "100"; vol.step = "5";
    vol.value = String(Math.round(prefs.audioVolume * 100));
    vol.setAttribute("aria-label", "Volume");
    var volVal = el("span", "nst-slider-val", vol.value + "%");
    vol.addEventListener("input", function () { volVal.textContent = vol.value + "%"; P.set({ audioVolume: Number(vol.value) / 100 }); });
    volRow.appendChild(vol);
    volRow.appendChild(volVal);
    aud.appendChild(volRow);
    applyMuteState(!!prefs.audioMuted);
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

    // (QA/a11y) dialog contract: Escape closes, Tab cycles inside the dialog,
    // and focus returns to the gear button (or whatever opened it) on close.
    var opener = document.activeElement;
    function close() {
      try { overlay.remove(); } catch (e) {}
      document.removeEventListener("keydown", onKey);
      if (opener && opener.focus) { try { opener.focus(); } catch (e2) {} }
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab" || !overlay.isConnected) return;
      if (overlay.nextElementSibling && overlay.nextElementSibling.classList &&
          overlay.nextElementSibling.classList.contains("nst-modal-overlay-top")) return; // reset confirm owns focus
      var items = modal.querySelectorAll("button, input, select, [tabindex]:not([tabindex='-1'])");
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
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
    // (QA/a11y) same dialog contract as Settings: Escape cancels, Tab stays
    // inside, focus returns to the reset button that opened this confirm.
    var opener = document.activeElement;
    function close() {
      try { overlay.remove(); } catch (e) {}
      document.removeEventListener("keydown", onConfirmKey, true);
      if (opener && opener.focus) { try { opener.focus(); } catch (e2) {} }
    }
    function onConfirmKey(e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
      if (e.key !== "Tab") return;
      var items = modal.querySelectorAll("button");
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onConfirmKey, true);
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
    // (C1-03) irreversible action: default focus goes to Cancel so a reflexive
    // Enter can't wipe every save on the device; the danger button stays last
    // in tab order and visually prominent.
    cancel.focus();
  }

  // (C1-01) the nav Help button — a compact dialog with the same contract as
  // Settings (Escape closes, Tab cycles, focus returns to the opener).
  function buildHelpModal() {
    var overlay = el("div", "nst-modal-overlay");
    var modal = el("div", "nst-modal nst-modal-sm");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-label", "Help");
    var head = el("div", "nst-modal-head");
    head.appendChild(el("h2", "nst-modal-title", "Help"));
    var x = el("button", "nst-modal-x", "✕");
    x.type = "button";
    x.setAttribute("aria-label", "Close help");
    head.appendChild(x);
    modal.appendChild(head);
    var body = el("div", "nst-modal-body");
    var items = [
      ["WWTBANE", "A game-show quiz — climb the money ladder by answering questions in a row; wrong answers end the run but banked coins stay."],
      ["StarNix", "Three arcade games where the questions are the ammunition — play to drill, the games adapt to what you miss."],
      ["Practice Exams", "Straight study: Practice mode with instant feedback, or a timed exam-like sitting with results by domain."],
      ["Question banks", "Pick which certification bank every tool studies from — use the picker on this page or Settings → Question bank."],
      ["Settings", "The gear in the top right: accessibility (reduced motion, contrast, text size), audio, and saved-data reset."],
    ];
    items.forEach(function (it) {
      var row = el("div", "nst-help-row");
      row.appendChild(el("b", null, it[0]));
      row.appendChild(el("p", "nst-set-note", it[1]));
      body.appendChild(row);
    });
    modal.appendChild(body);
    overlay.appendChild(modal);
    var opener = document.activeElement;
    function close() {
      try { overlay.remove(); } catch (e) {}
      document.removeEventListener("keydown", onKey);
      if (opener && opener.focus) { try { opener.focus(); } catch (e2) {} }
    }
    function onKey(e) {
      if (e.key === "Escape") { close(); return; }
      if (e.key !== "Tab" || !overlay.isConnected) return;
      var items2 = modal.querySelectorAll("button");
      var first = items2[0], last = items2[items2.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    x.addEventListener("click", close);
    overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(overlay);
    x.focus();
  }

  // (C8-09) remember which tool was opened last and mark its card — a small
  // landmark for returning users, no reordering or behavior change.
  function renderLastVisited() {
    var cards = document.querySelectorAll(".nst-card[data-tool]");
    var last = "";
    try { last = localStorage.getItem("nst.lastTool") || ""; } catch (e) {}
    [].forEach.call(cards, function (card) {
      card.addEventListener("click", function () {
        try { localStorage.setItem("nst.lastTool", card.getAttribute("data-tool")); } catch (e) {}
      });
      if (last && card.getAttribute("data-tool") === last) {
        card.appendChild(el("span", "nst-card-last", "Last visited"));
      }
    });
  }

  function init() {
    var btn = document.getElementById("nst-settings-btn");
    if (btn) btn.addEventListener("click", buildModal);
    var help = document.getElementById("nst-help-btn");
    if (help) help.addEventListener("click", buildHelpModal);
    renderNavBadge();
    renderCertSelector();
    renderLastVisited();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
