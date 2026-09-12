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

  /* ------------------------------------------------------------------
   * Opening and closing a dialog.
   *
   * The focus trap keeps TAB inside the dialog, which is what a keyboard user
   * needs -- but it does nothing for a screen reader's virtual cursor or its
   * element list, so every control on the page behind stayed reachable and
   * announced. `inert` removes the background from focus, hit-testing and the
   * accessibility tree in one step.
   *
   * The depth counter exists because these nest: the Reset confirmation opens
   * on top of Settings, and closing it must not un-inert the page while
   * Settings is still up.
   * ------------------------------------------------------------------ */
  var _dialogDepth = 0;
  function backgroundParts() {
    return [document.querySelector(".nst-app"), document.querySelector(".nst-bg")].filter(Boolean);
  }
  function openDialog(el_) {
    if (_dialogDepth === 0) {
      backgroundParts().forEach(function (n) {
        n.inert = true;                    // the property, where it exists
        n.setAttribute("inert", "");       // and the attribute, which is what the rest read
      });
    }
    _dialogDepth++;
    document.body.appendChild(el_);
  }
  function closeDialog(el_) {
    try { el_.remove(); } catch (e) { /* already gone */ }
    _dialogDepth = Math.max(0, _dialogDepth - 1);
    if (_dialogDepth === 0) {
      backgroundParts().forEach(function (n) {
        n.inert = false;
        n.removeAttribute("inert");
      });
    }
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
      var v = el("span", "nst-diag-v"); v.textContent = String(r[1]);   // (QA v2.1.1) UA string as text, not markup
      meta.appendChild(v);
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
      var code = el("code"); code.textContent = kv[0];   // (QA v2.1.1) storage key names as text, not markup
      r.appendChild(code);
      r.appendChild(el("span", "nst-diag-size", fmtBytes(kv[1])));
      ls.appendChild(r);
    });
    wrap.appendChild(ls);
    // raw prefs — (QA v2.1.1) poisoned localStorage values must render inert
    var pre = el("pre", "nst-diag-json"); pre.textContent = JSON.stringify(prefs, null, 2);
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
        if (b.id) txt.appendChild(el("div", "nst-bank-rowsub", esc(b.cert || "") + (Number(b.count) > 0 ? " · " + Number(b.count) + " questions" : "")));   // (QA v2.1.1) manifest count coerced numeric
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
            // The bank is already in hand here; the dashboard needs exactly it.
            renderDashboard(loaded, own.cert.code + " · " + VARIANT_LABEL[own.variant]);
          }).catch(function () {
            if ((Bank.active() || "") === active) hint.textContent = "Couldn't load this bank — check your connection and re-select it.";
            renderDashboard(null);
          });
        } else {
          hint.textContent = "Pick an exam and question set to begin.";
          renderDashboard(null);
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

      // Playable certs get a full tile with question-set buttons; certs with no
      // bank yet are far more common right now (7 of 8), so they're collapsed
      // into one small muted line instead of seven equally-weighted dead tiles.
      var soon = [];
      certs.forEach(function (c) {
        var playable = c.banks && !c.comingSoon;
        if (!playable) { soon.push(c.code || c.name || ""); return; }
        var tile = el("div", "nst-certtile");
        var head = el("div", "nst-certtile-head");
        head.appendChild(el("span", "nst-certtile-code", esc(c.code || "")));
        if (c.name) head.appendChild(el("span", "nst-certtile-name", esc(c.name)));
        tile.appendChild(head);
        var vars = el("div", "nst-certtile-variants");
        if (c.banks["25"]) vars.appendChild(mkVariant(c, "25"));
        if (c.banks.full) vars.appendChild(mkVariant(c, "full"));
        tile.appendChild(vars);
        grid.appendChild(tile);
      });
      if (soon.length) {
        var soonRow = el("p", "nst-cert-soon");
        soonRow.appendChild(document.createTextNode("Also coming soon: " + soon.join(" · ")));
        wrap.appendChild(soonRow);
      }
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

    // --- Backup ---
    // Everything NST knows lives in this browser. "Clear browsing data" takes all
    // of it, and no in-browser store (IndexedDB, OPFS, SQLite-over-WASM) survives
    // that -- they are the same bucket. A file the user keeps is the only real
    // backup, so this section exists to make writing one a one-click habit.
    var bk = section("Back up your progress");
    bk.appendChild(el("p", "nst-set-note", "Mastery history, exam attempts and game saves live only in this browser \u2014 clearing your browsing data erases them. Save a backup file you can restore here or on another device."));
    var bkStatus = el("p", "nst-set-note nst-bk-status", "");
    var bkRow = el("div", "nst-bk-row");

    var saveBtn = el("button", "nst-btn nst-btn-primary", "\u2193 Save backup file");
    saveBtn.type = "button";
    saveBtn.addEventListener("click", function () {
      var B = window.NSTBackup;
      if (!B) { bkStatus.textContent = "Backup isn't available in this build."; return; }
      var sum = B.summarize(B.collect());
      if (!sum.keys) { bkStatus.textContent = "There's no saved progress to back up yet."; return; }
      var r = B.download();
      bkStatus.textContent = r.ok
        ? "Saved " + r.name + " \u2014 " + sum.keys + " item(s), " + fmtBytes(sum.bytes) + "."
        : "Couldn't save the file: " + r.error;
    });
    bkRow.appendChild(saveBtn);

    // A hidden file input keeps the affordance a normal button.
    var pick = el("input", "nst-bk-file");
    pick.type = "file";
    pick.accept = "application/json,.json";
    pick.style.display = "none";
    var restoreBtn = el("button", "nst-btn nst-btn-ghost", "\u2191 Restore from file\u2026");
    restoreBtn.type = "button";
    restoreBtn.addEventListener("click", function () { pick.click(); });
    pick.addEventListener("change", function () {
      var f = pick.files && pick.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onerror = function () { bkStatus.textContent = "Couldn't read that file."; };
      rd.onload = function () {
        var B = window.NSTBackup;
        var chk = B.inspect(String(rd.result || ""));
        if (!chk.ok) { bkStatus.textContent = chk.error; pick.value = ""; return; }
        // Restoring overwrites real progress -- always confirm, and say what is in
        // the file so the choice is informed rather than blind.
        var when = chk.exportedAt ? new Date(chk.exportedAt).toLocaleDateString() : "an unknown date";
        confirmRestore(overlay, chk, when, function (mode) {
          var res = B.restore(String(rd.result || ""), { mode: mode });
          bkStatus.textContent = res.ok
            ? "Restored " + res.restored.keys + " item(s) from " + when + ". Reopen a tool to see it."
            : res.error;
          pick.value = "";
        }, function () { pick.value = ""; });
      };
      rd.readAsText(f);
    });
    bkRow.appendChild(restoreBtn);
    bkRow.appendChild(pick);
    bk.appendChild(bkRow);
    bk.appendChild(bkStatus);

    // Storage headroom + eviction resistance, shown only once we know something.
    if (window.NSTBackup && window.NSTBackup.estimate) {
      var quotaLine = el("p", "nst-set-note nst-bk-quota", "");
      bk.appendChild(quotaLine);
      window.NSTBackup.estimate().then(function (e) {
        var mine = "NST is using " + fmtBytes(e.ours) + " on this device";
        if (e.quota) {
          var pct = e.pct != null && e.pct < 1 ? "<1" : String(Math.round(e.pct || 0));
          mine += " \u00b7 " + pct + "% of this browser's storage is in use";
        }
        quotaLine.textContent = mine + ".";
      }).catch(function () {});
      // Ask the browser not to evict us automatically. This does not survive a
      // manual clear -- only the backup file does -- so it is a quiet extra, not
      // a promise we make to the user.
      try { window.NSTBackup.requestPersist(); } catch (ePst) {}
    }
    body.appendChild(bk);

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
      closeDialog(overlay);
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

    openDialog(overlay);
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
      closeDialog(overlay);
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
    openDialog(overlay);
    // (C1-03) irreversible action: default focus goes to Cancel so a reflexive
    // Enter can't wipe every save on the device; the danger button stays last
    // in tab order and visually prominent.
    cancel.focus();
  }

  // Restoring overwrites real progress, so it gets the same treatment as Reset:
  // an explicit confirm that says what is in the file, with the safe choice
  // focused. "Merge" is offered because restoring an old backup onto a newer
  // device should not have to mean throwing away the newer work.
  function confirmRestore(settingsOverlay, chk, when, onConfirm, onCancel) {
    var overlay = el("div", "nst-modal-overlay nst-modal-overlay-top");
    var modal = el("div", "nst-modal nst-modal-sm");
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.appendChild(el("h3", "nst-modal-title", "Restore this backup?"));
    var what = chk.summary.tools.length ? chk.summary.tools.join(", ") : "saved data";
    modal.appendChild(el("p", "nst-modal-body-text",
      "That file was saved on " + esc(when) + " and contains " + chk.summary.keys +
      " item(s): " + esc(what) + "." +
      (chk.rejected ? " (" + chk.rejected + " entr" + (chk.rejected === 1 ? "y" : "ies") + " outside NST will be ignored.)" : "")));
    modal.appendChild(el("p", "nst-modal-body-text",
      "Replace swaps your current progress for the backup. Merge keeps anything the backup doesn\u2019t mention."));
    var row = el("div", "nst-modal-actions");
    var cancel = el("button", "nst-btn nst-btn-ghost", "Cancel");
    cancel.type = "button";
    var merge = el("button", "nst-btn nst-btn-ghost", "Merge");
    merge.type = "button";
    var replace = el("button", "nst-btn nst-btn-danger", "Replace");
    replace.type = "button";
    var opener = document.activeElement;
    var done = false;
    function close(cancelled) {
      closeDialog(overlay);
      document.removeEventListener("keydown", onKeyR, true);
      if (opener && opener.focus) { try { opener.focus(); } catch (e2) {} }
      if (cancelled && !done && onCancel) onCancel();
    }
    function onKeyR(e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); return; }
      if (e.key !== "Tab") return;
      var items = modal.querySelectorAll("button");
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyR, true);
    cancel.addEventListener("click", function () { close(true); });
    merge.addEventListener("click", function () { done = true; close(false); onConfirm("merge"); });
    replace.addEventListener("click", function () { done = true; close(false); onConfirm("replace"); });
    row.appendChild(cancel); row.appendChild(merge); row.appendChild(replace);
    modal.appendChild(row);
    overlay.appendChild(modal);
    openDialog(overlay);
    cancel.focus();   // same rule as Reset: the safe option takes a reflexive Enter
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
      closeDialog(overlay);
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
    openDialog(overlay);
    x.focus();
  }

  /* ---------------------------------------------------------------------
   * The progress dashboard (v2.9.0)
   *
   * One picture for all three tools. Every tool writes to the same mastery
   * store, so this is a read of that store rolled up against the active bank
   * (shared/nst-dashboard.js does the deciding; this only draws it).
   *
   * Two rules it holds to, because a dashboard that overstates is worse than
   * none: it stays hidden until there is a bank to measure against, and it
   * shows a single line rather than a wall of zeros until something has
   * actually been answered.
   * ------------------------------------------------------------------- */

  var DASH_R = 26;                       // ring radius, matching the viewBox below
  var DASH_C = 2 * Math.PI * DASH_R;     // circumference, for the dash offset

  function dashStat(label, value, sub, cls, href, title) {
    var d = el("div", "nst-dash-stat" + (cls ? " " + cls : ""));
    d.appendChild(el("dt", "nst-dash-stat-k", esc(label)));
    var dd = el("dd", "nst-dash-stat-v");
    // A figure that leads somewhere becomes a link; the rest stay plain text, so
    // nothing looks clickable that isn't.
    var host = dd;
    if (href) {
      var a = el("a", "nst-dash-statlink");
      a.href = href;
      if (title) { a.title = title; a.setAttribute("aria-label", title); }
      dd.appendChild(a);
      host = a;
    }
    host.appendChild(document.createTextNode(String(value)));
    if (sub) host.appendChild(el("span", "nst-dash-stat-sub", esc(String(sub))));
    d.appendChild(dd);
    return d;
  }

  function dashRing(pct) {
    var wrap = el("div", "nst-dash-ring");
    wrap.setAttribute("role", "img");
    wrap.setAttribute("aria-label", pct + "% of this bank mastered");
    // Built with createElementNS, not innerHTML: SVG inside an HTML string is
    // parsed as HTML and the shapes silently never render.
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 64 64");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    function circle(cls) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", "32"); c.setAttribute("cy", "32"); c.setAttribute("r", String(DASH_R));
      c.setAttribute("class", cls);
      return c;
    }
    var track = circle("nst-dash-ring-track");
    var fill = circle("nst-dash-ring-fill");
    // CSSOM, not a style attribute: this page's CSP has no 'unsafe-inline', which
    // blocks style attributes but not property assignment.
    fill.style.strokeDasharray = DASH_C.toFixed(2);
    fill.style.strokeDashoffset = (DASH_C * (1 - Math.max(0, Math.min(100, pct)) / 100)).toFixed(2);
    svg.appendChild(track); svg.appendChild(fill);
    wrap.appendChild(svg);
    var val = el("span", "nst-dash-ring-val", esc(pct + "%"));
    wrap.appendChild(val);
    return wrap;
  }

  /* Naming a weak area and leaving the reader to go find it is half a feature,
   * so each row is a link that opens Practice Exams already focused on that
   * domain. It sets PE's own preference key rather than inventing a second
   * channel -- PE validates that value against the live bank on load, so a
   * stale domain falls back to "all", never to an empty session. */
  function drillTo(domain) {
    try {
      var K = "nst.practice-exams.prefs.v1";
      var raw = window.NSTSafeParse ? window.NSTSafeParse(localStorage.getItem(K)) : null;
      localStorage.setItem(K, JSON.stringify(window.NSTDash.withFocus(raw, domain)));
    } catch (e) { /* storage unavailable -- the link still opens the tool */ }
  }

  function dashWeak(weakest) {
    var box = el("div", "nst-dash-weak");
    box.appendChild(el("h3", "nst-dash-subtitle", "Weakest areas"));
    var ul = el("ul", "nst-dash-weaklist");
    weakest.forEach(function (w) {
      var li = el("li", "nst-dash-weakrow");
      // An <a>, not a click handler on the row: it must be focusable, openable
      // in a new tab, and readable as a link by a screen reader.
      var a = el("a", "nst-dash-weaklink");
      a.href = "./practice-exams/";
      a.appendChild(el("span", "nst-dash-weakname", esc(w.domain)));
      var bar = el("span", "nst-dash-weakbar");
      var fill = el("i", "nst-dash-weakfill");
      fill.style.width = w.pct + "%";
      bar.appendChild(fill);
      a.appendChild(bar);
      a.appendChild(el("span", "nst-dash-weakpct", esc(w.pct + "%")));
      // The bar is decorative; the row already reads as name + percentage.
      bar.setAttribute("aria-hidden", "true");
      a.setAttribute("aria-label",
        "Practise " + w.domain + " — " + w.pct + "% mastered, " + w.seen + " of " + w.total + " seen");
      a.title = "Practise " + w.domain + " in Practice Exams";
      a.addEventListener("click", function () { drillTo(w.domain); });
      li.appendChild(a);
      ul.appendChild(li);
    });
    box.appendChild(el("p", "nst-dash-weakhint", "Pick one to practise just that area."));
    box.appendChild(ul);
    return box;
  }

  /* The readiness band: where an estimate of today's exam score sits against the
   * pass mark. Drawn as a RANGE with the bar marked, never as a single number,
   * because a point estimate reads as a promise. shared/nst-readiness.js decides
   * what may be claimed; this only places it on a track. */
  function dashReadiness(r) {
    var box = el("div", "nst-dash-ready nst-dash-ready--" + r.verdict);
    var head = el("div", "nst-dash-readyhead");
    head.appendChild(el("h3", "nst-dash-subtitle", "Exam readiness"));
    head.appendChild(el("span", "nst-dash-readylabel", esc(r.label)));
    box.appendChild(head);

    if (r.verdict !== "not-enough") {
      var track = el("div", "nst-dash-readytrack");
      track.setAttribute("role", "img");
      track.setAttribute("aria-label",
        "Estimated score between " + r.low + "% and " + r.high + "%, against a " + r.pass + "% pass mark.");
      var band = el("span", "nst-dash-readyband");
      band.style.left = r.low + "%";
      band.style.width = Math.max(1, r.high - r.low) + "%";
      var mark = el("span", "nst-dash-readymark");
      mark.style.left = r.pass + "%";
      var dot = el("span", "nst-dash-readydot");
      dot.style.left = r.score + "%";
      track.appendChild(band); track.appendChild(mark); track.appendChild(dot);
      box.appendChild(track);

      // One caption, under the pass mark itself. The range is prose in the
      // detail line below: figures pinned to the track's ends would read as
      // its endpoints, which they are not.
      var scale = el("div", "nst-dash-readyscale");
      var passCap = el("span", "nst-dash-readypass", esc(r.pass + "% to pass"));
      passCap.style.left = r.pass + "%";
      // Centred under the mark, except near the ends, where centring would push
      // the caption off the panel. A bank can author any pass threshold.
      if (r.pass < 15) passCap.style.transform = "translateX(0)";
      else if (r.pass > 85) passCap.style.transform = "translateX(-100%)";
      scale.appendChild(passCap);
      box.appendChild(scale);
    }

    box.appendChild(el("p", "nst-dash-readydetail", esc(r.detail)));
    return box;
  }

  function renderDashboard(bank, label) {
    var host = document.getElementById("nst-dash");
    if (!host) return;
    var Dash = window.NSTDash, Mast = window.NSTMastery;

    // No bank, no measuring stick. Hidden beats a panel full of dashes.
    if (!bank || !bank.questions || !bank.questions.length || !Dash || !Mast) {
      host.hidden = true;
      host.innerHTML = "";
      return;
    }

    var history = [];
    try { history = window.NSTSafeParse(localStorage.getItem("nst.practice-exams.history.v1")) || []; }
    catch (e) { history = []; }

    var m;
    try { m = Dash.model({ summary: Mast.summary(bank.questions), history: history }); }
    catch (e) { host.hidden = true; return; }

    host.innerHTML = "";
    host.hidden = false;

    var head = el("div", "nst-dash-head");
    var h2 = el("h2", "nst-dash-title", "Your progress");
    h2.id = "nst-dash-title";
    head.appendChild(h2);
    if (label) head.appendChild(el("span", "nst-dash-bank", esc(label)));
    host.appendChild(head);

    if (!m.hasData) {
      host.appendChild(el("p", "nst-dash-nudge", esc(m.nudge)));
      return;
    }

    var body = el("div", "nst-dash-body");
    body.appendChild(dashRing(m.masteredPct));

    var stats = el("dl", "nst-dash-stats");
    stats.appendChild(dashStat("Mastered", m.mastered, "of " + m.total));
    stats.appendChild(dashStat("Seen", m.seen, "of " + m.total));
    if (m.accuracy != null) stats.appendChild(dashStat("Accuracy", m.accuracy + "%"));
    // "0 due" reads as finished, which is the opposite of what it means, so the
    // empty queue says when the next card comes back instead.
    // "Due now" is the one figure with work attached, so it opens the review
    // session Practice Exams offers for exactly these questions.
    if (m.due > 0) {
      stats.appendChild(dashStat("Due now", m.due, null, "due", "./practice-exams/",
        "Review the " + m.due + " questions due now, in Practice Exams"));
    }
    else if (m.nextDue) stats.appendChild(dashStat("Next review", m.nextDue));
    if (m.exam) {
      stats.appendChild(dashStat("Best exam", m.exam.best.pct + "%",
        m.exam.best.pass ? "pass" : "fail", m.exam.best.pass ? "pass" : "fail"));
    }
    body.appendChild(stats);
    host.appendChild(body);

    // Readiness needs the raw questions and records, not the rollup: it weighs
    // each question on its own evidence and its own guessability.
    var Ready = window.NSTReadiness;
    if (Ready) {
      var r = null;
      try {
        r = Ready.estimate({
          questions: bank.questions,
          mastery: Mast,
          pass: bank.meta && bank.meta.pass,
          examSize: window.PE_CONFIG && window.PE_CONFIG.EXAM_QUESTION_COUNT,
        });
      } catch (e) { r = null; }
      if (r) host.appendChild(dashReadiness(r));
    }

    if (m.weakest.length) host.appendChild(dashWeak(m.weakest));
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
    // When the tool is served from the app server (server/server.mjs) rather than a
    // static host, show who is signed in and give them a way out. NSTSync tells us
    // asynchronously, and on a static host the event never fires, so nothing renders.
    window.addEventListener("nst-account", function (ev) {
      var me = ev && ev.detail;
      if (!me || document.getElementById("nst-account-chip")) return;
      var utils = document.querySelector(".nst-nav-utils");
      if (!utils) return;
      var wrap = el("div", "nst-account");
      wrap.id = "nst-account-chip";
      var who = el("span", "nst-account-who", (me.displayName || me.username) + (me.role === "root" ? " · root" : ""));
      who.title = "Signed in as " + me.username;
      wrap.appendChild(who);
      if (me.role === "root") {
        var admin = el("a", "nst-account-link", "Accounts");
        admin.href = "/admin";
        wrap.appendChild(admin);
      }
      // Sign out via fetch rather than a form post. This page's CSP sets
      // `form-action 'none'` -- correct hardening for a launcher that otherwise has
      // no forms at all -- which silently blocks a <form> submit. The POST still
      // carries the CSRF token, so the server's checks are unchanged.
      var b = el("button", "nst-account-link", "Sign out");
      b.type = "button";
      b.addEventListener("click", function () {
        var tok = (document.cookie.match(/(?:^|;\s*)nst_csrf=([^;]*)/) || [])[1] || "";
        try { tok = decodeURIComponent(tok); } catch (e) {}
        b.disabled = true;
        fetch("/logout", {
          method: "POST", credentials: "same-origin", redirect: "manual",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: "csrf=" + encodeURIComponent(tok),
        }).then(function () { window.location.href = "/login"; })
          .catch(function () { b.disabled = false; });
      });
      wrap.appendChild(b);
      utils.insertBefore(wrap, utils.firstChild);
    });

    var help = document.getElementById("nst-help-btn");
    if (help) help.addEventListener("click", buildHelpModal);
    renderNavBadge();
    renderCertSelector();
    renderLastVisited();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
