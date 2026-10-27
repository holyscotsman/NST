/* Nutanix Practice Exams — app shell.
 * Entry screen: choose Practice Mode or Exam Mode, see exam parameters and
 * recent attempts. Routes into the chosen mode and back. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var ui = PE.ui, engine = PE.engine;
  var HOME = "../";  // back to the NST launcher

  function fmtDur(ms) {   // (C4-04) mm:ss for attempt durations
    var t = Math.max(0, Math.round(ms / 1000));
    return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2);
  }
  function fmtDate(ms) {
    try {
      var d = new Date(ms);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
             d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  // Session continuity: remember the question-set choice so returning players pick up
  // where they left off. Parse-guarded — a corrupt value falls back to defaults.
  // False until the entry screen has been painted once: the first mount must not
  // steal focus, every later one must take it back from the view it replaced.
  var _entryShown = false;

  var PREFS_KEY = "nst.practice-exams.prefs.v1";
  function loadPrefs() {
    try { return window.NSTSafeParse(localStorage.getItem(PREFS_KEY)) || {}; } catch (e) { return {}; }
  }
  function savePrefs(patch) {
    try {
      var p = loadPrefs();
      for (var k in patch) if (Object.prototype.hasOwnProperty.call(patch, k)) p[k] = patch[k];
      localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    } catch (e) { /* storage unavailable */ }
  }

  function showEntry(container) {
    var el = ui.el, esc = ui.esc, cfg = window.PE_CONFIG;
    var meta = engine.bankMeta();
    var hasQ = meta.total > 0;
    var randomCount = Math.min(cfg.EXAM_QUESTION_COUNT, meta.total);
    var passN = Math.round(engine.passMark() * 100);   // (v2.72.0) this bank's bar, not a global one
    var useFull = loadPrefs().useFull === true;   // question-set choice, remembered across visits
    container.innerHTML = "";
    var root = el("div", "pe-entry");

    // Header
    var header = el("div", "pe-entry-head");
    var back = el("a", "pe-back", "&#8592; Main menu");
    back.href = HOME;
    header.appendChild(back);
    header.appendChild(el("h1", "pe-entry-title", "Nutanix Practice Exams"));
    var problem = bankProblem();
    header.appendChild(el("p", "pe-entry-sub",
      hasQ ? (esc(meta.name) + " · " + meta.total + " questions in the bank")
           : problem ? "The question bank could not be loaded."
           : "Choose a question bank to begin."));
    root.appendChild(header);

    // Question-bank picker — switch certifications/banks without leaving Practice Exams.
    root.appendChild(buildBankPicker(container));

    // No bank selected yet: prompt to pick one above (the picker is already rendered).
    // Unless something FAILED, in which case say that instead — "select a bank above" is
    // useless advice to someone whose bank is selected and whose file just 404'd.
    if (!hasQ) {
      var prompt = el("div", "pe-pickprompt");
      if (problem) {
        prompt.appendChild(el("p", null, problem === "manifest"
          ? "Couldn't load the list of question banks — the server didn't answer. Check your connection, then try again."
          : "Couldn't load this question bank — the file is missing, or the server didn't answer. Check your connection, then try again."));
        var retry = el("button", "pe-btn pe-btn-primary", "Try again");
        retry.type = "button";
        retry.addEventListener("click", function () { reloadBank(container); });
        prompt.appendChild(retry);
      } else {
        prompt.appendChild(el("p", null, "Select a question bank above, then start a practice test or exam."));
      }
      root.appendChild(prompt);
      container.appendChild(root);
      try { window.scrollTo(0, 0); } catch (e) {}
      return;
    }

    // Question-set picker (applies to whichever mode you start)
    var pick = el("div", "pe-setpick");
    pick.setAttribute("role", "radiogroup");
    pick.setAttribute("aria-label", "Question set");
    pick.appendChild(el("span", "pe-setpick-label", "Question set"));
    var segRandom = el("button", "pe-seg" + (useFull ? "" : " on"), randomCount + " random");
    var segFull = el("button", "pe-seg" + (useFull ? " on" : ""), "Full bank · " + meta.total);
    [segRandom, segFull].forEach(function (b) { b.type = "button"; b.setAttribute("role", "radio"); });
    segRandom.setAttribute("aria-checked", String(!useFull));
    segFull.setAttribute("aria-checked", String(useFull));
    function selectSet(full) {
      useFull = full;
      savePrefs({ useFull: full });
      segRandom.classList.toggle("on", !full);
      segFull.classList.toggle("on", full);
      segRandom.setAttribute("aria-checked", String(!full));
      segFull.setAttribute("aria-checked", String(full));
      updateFacts();
    }
    segRandom.addEventListener("click", function () { selectSet(false); });
    segFull.addEventListener("click", function () { selectSet(true); });
    pick.appendChild(segRandom);
    pick.appendChild(segFull);
    root.appendChild(pick);

    // (C6-01) optional focus domain for Practice mode — study one blueprint
    // area at a time. Persisted; Exam mode always draws from the whole bank.
    var focusDomain = loadPrefs().focusDomain || "";
    var domainNames = Object.keys(meta.domains).sort();
    if (domainNames.indexOf(focusDomain) < 0) focusDomain = "";
    if (domainNames.length > 1) {
      var dwrap = el("div", "pe-setpick pe-domainpick");
      dwrap.setAttribute("role", "radiogroup");
      dwrap.setAttribute("aria-label", "Practice focus domain");
      dwrap.appendChild(el("span", "pe-setpick-label", "Practice focus"));
      var dbtns = [];
      var addChip = function (label, value, count) {
        var b = el("button", "pe-seg" + ((focusDomain === value) ? " on" : ""), esc(label) + (count ? " · " + count : ""));
        b.type = "button"; b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", String(focusDomain === value));
        b.addEventListener("click", function () {
          focusDomain = value;
          savePrefs({ focusDomain: value });
          dbtns.forEach(function (x) { x.b.classList.toggle("on", x.v === value); x.b.setAttribute("aria-checked", String(x.v === value)); });
        });
        dbtns.push({ b: b, v: value });
        dwrap.appendChild(b);
      };
      addChip("All domains", "", 0);
      domainNames.forEach(function (d) { addChip(d, d, meta.domains[d]); });
      root.appendChild(dwrap);
    }

    function chosenCount() { return useFull ? meta.total : randomCount; }
    function examMinutes() { return Math.round(cfg.EXAM_TIME_LIMIT_MIN * chosenCount() / cfg.EXAM_QUESTION_COUNT); }

    /* (v2.12.0) Review due — the first thing to offer someone coming back.
     * Spaced repetition only works if the due cards actually get answered, and
     * "17 due" on the home page was a number with nowhere to go. Rendered only
     * when something IS due, so it never sits there as an empty promise. */
    /* An exam interrupted by the phone reclaiming the tab comes back here first.
     * It goes above everything else, because starting a fresh exam would throw
     * the interrupted one away and nothing would have said so. */
    if (PE.examResume && hasQ) {
      var bankId = (window.NSTBank && window.NSTBank.active && window.NSTBank.active()) || "";
      var pend = PE.examResume.pending(bankId);
      /* There was a saved exam and it cannot be rebuilt -- the bank changed
       * under it, or the record was damaged. Say so. The launcher advertises an
       * unfinished exam from a necessarily shallower check (it has no engine to
       * rebuild questions with), so somebody may have followed that link here
       * specifically to find it, and silence would be a dead end. */
      if (pend && pend.unusable) {
        var dead = el("p", "pe-resume-gone");
        dead.setAttribute("role", "status");
        dead.textContent = "An unfinished exam could not be restored — the question bank has "
          + "changed since it was started, or the saved copy was damaged. It has been cleared.";
        root.appendChild(dead);
        pend = null;
      }
      if (pend) {
        var mmss = function (ms) {
          var t = Math.max(0, Math.round(ms / 1000));
          return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2);
        };
        var ecard = el("button", "pe-modecard pe-modecard-resume");
        ecard.type = "button";
        ecard.innerHTML = pend.expired
          ? '<div class="pe-modecard-tag">UNFINISHED EXAM</div>' +
            '<h2 class="pe-modecard-title">Time ran out while you were away</h2>' +
            '<p class="pe-modecard-desc">The clock on a timed exam keeps running whether the page is open or not, ' +
              'so this one has finished. Open it to see how the ' + pend.answered + ' you answered scored.</p>' +
            '<ul class="pe-modecard-facts"><li>' + pend.answered + ' of ' + pend.total + ' answered</li></ul>' +
            '<span class="pe-modecard-cta">See the result ' + ui.ICONS.arrowRight + '</span>'
          : '<div class="pe-modecard-tag">EXAM IN PROGRESS</div>' +
            '<h2 class="pe-modecard-title">Resume your exam — ' + mmss(pend.remainingMs) + ' left</h2>' +
            '<p class="pe-modecard-desc">Picked up exactly where you left off, same questions in the same order. ' +
              'The clock kept running while you were away, so resuming does not buy you time.</p>' +
            '<ul class="pe-modecard-facts"><li>' + pend.answered + ' of ' + pend.total + ' answered</li></ul>' +
            '<span class="pe-modecard-cta">Resume ' + ui.ICONS.arrowRight + '</span>';
        ecard.addEventListener("click", function () {
          PE.exam.start(container, {
            resume: true,
            onExit: function () { showEntry(container); },
            onHome: function () { window.location.href = HOME; },
          });
        });
        root.appendChild(ecard);

        var discard = el("button", "pe-btn pe-btn-ghost pe-resume-discard",
          pend.expired ? "Discard it" : "Discard and start fresh");
        discard.type = "button";
        discard.addEventListener("click", function () {
          ui.confirm("Discard the unfinished exam?",
            "Its " + pend.answered + " answered question" + (pend.answered === 1 ? "" : "s") +
            " will be thrown away. This cannot be undone.",
            "Discard", function () { PE.examResume.clear(); showEntry(container); });
        });
        root.appendChild(discard);
      }
    }

    var Review = window.NSTReview, Mast = window.NSTMastery;
    if (Review && Mast && hasQ) {
      var dq = Review.dueQueue({ questions: engine.buildPractice(), mastery: Mast });
      if (dq.total > 0) {
        var rcard = el("button", "pe-modecard pe-modecard-review");
        rcard.type = "button";
        // (v2.69.0) The tag, heading, paragraph and button are four claims about
        // one set, so NSTReview composes them together -- the module that knows
        // which of them are revision and which are new material. The number in
        // the heading is the one its own word applies to: "Review 6 due" beside
        // "6 due again · 3 new" agrees with itself, and a queue of nothing but
        // new questions is not headed "Review" at all.
        var hl = Review.headline(dq);
        rcard.innerHTML =
          '<div class="pe-modecard-tag">' + esc(hl.tag) + '</div>' +
          '<h2 class="pe-modecard-title">' + esc(hl.title) + '</h2>' +
          '<p class="pe-modecard-desc">' + esc(hl.blurb) + '</p>' +
          '<ul class="pe-modecard-facts"><li>' + esc(Review.describe(dq)) + '</li></ul>' +
          '<span class="pe-modecard-cta">' + esc(hl.cta) + ' ' + ui.ICONS.arrowRight + '</span>';
        rcard.addEventListener("click", function () {
          PE.practice.start(container, {
            questions: dq.questions,
            onExit: function () { showEntry(container); },
            onHome: function () { window.location.href = HOME; },
          });
        });
        root.appendChild(rcard);
      }
    }

    // Mode cards
    var modes = el("div", "pe-modes");

    var pcard = el("button", "pe-modecard pe-modecard-practice");
    pcard.type = "button";
    pcard.innerHTML =
      '<div class="pe-modecard-tag">PRACTICE</div>' +
      '<h2 class="pe-modecard-title">Practice Mode</h2>' +
      '<p class="pe-modecard-desc">Instant feedback after every question, the correct answer and explanation revealed, unlimited retries. Untimed — move at your own pace with free navigation.</p>' +
      '<ul class="pe-modecard-facts"><li class="pe-fact-count"></li><li>Instant feedback</li><li>Untimed</li></ul>' +
      '<span class="pe-modecard-cta">Start practicing ' + ui.ICONS.arrowRight + '</span>';
    // (C7-02) full bank passes count=null: buildPractice returns the whole pool
    // either way, but a null count is what marks the session resumable.
    pcard.addEventListener("click", function () { launch("practice", container, useFull ? null : chosenCount(), focusDomain); });   // (C6-01)
    modes.appendChild(pcard);

    var ecard = el("button", "pe-modecard pe-modecard-exam");
    ecard.type = "button";
    ecard.innerHTML =
      '<div class="pe-modecard-tag">EXAM</div>' +
      '<h2 class="pe-modecard-title">Exam Mode</h2>' +
      '<p class="pe-modecard-desc">A timed, exam-like sitting: randomized questions and answer order, flag-for-review, and no feedback until you submit. Pass at ' + passN + '%.</p>' +
      '<ul class="pe-modecard-facts"><li class="pe-fact-count"></li><li class="pe-fact-time"></li><li>' + passN + '% to pass</li></ul>' +
      '<span class="pe-modecard-cta">Start exam ' + ui.ICONS.arrowRight + '</span>';
    ecard.addEventListener("click", function () { launch("exam", container, chosenCount()); });
    modes.appendChild(ecard);
    root.appendChild(modes);

    function updateFacts() {
      var n = chosenCount();
      pcard.querySelector(".pe-fact-count").textContent = n + " questions";
      ecard.querySelector(".pe-fact-count").textContent = n + " questions";
      ecard.querySelector(".pe-fact-time").textContent = examMinutes() + " minutes";
    }
    updateFacts();

    // Recent attempts
    var history = engine.loadHistory();
    if (history.length) {
      root.appendChild(el("h3", "pe-h3", "Recent exam attempts"));
      var list = el("div", "pe-history");
      history.slice(0, 6).forEach(function (a) {
        var row = el("div", "pe-history-row " + (a.pass ? "pass" : "fail"));
        row.appendChild(el("span", "pe-history-badge", a.pass ? "PASS" : "FAIL"));
        row.appendChild(el("span", "pe-history-score", Number(a.pct) + "% · " + Number(a.correct) + "/" + Number(a.total)));   // (QA v2.1.1) stored values coerced numeric before the html-based el()
        var extra = (a.timedOut ? " · timed out" : "") + (a.durationMs ? " · " + fmtDur(a.durationMs) : "");
        row.appendChild(el("span", "pe-history-date", fmtDate(a.at) + extra));
        if (a.bank) row.appendChild(el("span", "pe-history-bank", esc(a.bank)));   // (C4-03)
        list.appendChild(row);
      });
      root.appendChild(list);
      // (C7-06) shared machines: attempts can be wiped (confirmed first)
      var clearBtn = el("button", "pe-btn pe-btn-ghost pe-clear-history", "Clear history");
      clearBtn.type = "button";
      clearBtn.addEventListener("click", function () {
        ui.confirm("Clear attempt history?", "All recorded exam attempts on this device will be removed.", "Clear", function () {
          engine.clearHistory();
          showEntry(container);
        });
      });
      root.appendChild(clearBtn);
    }

    root.appendChild(el("p", "pe-version", "Nutanix Study Tool · v" + (window.NST_VERSION || "dev")));   // (C6-08)
    container.appendChild(root);
    // Coming back from a mode replaces this view too, so the keyboard needs
    // putting back at its top rather than at <body>. NOT on the first paint:
    // moving focus before anyone has interacted interrupts a screen reader's
    // page-load announcement and is not what a fresh page should do.
    if (_entryShown) ui.focusView(root, ".pe-entry-title");
    _entryShown = true;
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function launch(mode, container, count, domain) {
    var opts = {
      count: count,
      domain: mode === "practice" ? (domain || null) : null,   // (C6-01) practice-only
      onExit: function () { showEntry(container); },
      onHome: function () { window.location.href = HOME; },
    };
    if (mode === "practice") PE.practice.start(container, opts);
    else PE.exam.start(container, opts);
  }

  // A "Question bank" button group: one button per bank in the manifest. Clicking one
  // switches the active bank here (mirrors the launcher's chooser). Adding a bank to the
  // manifest adds a button — no code change needed.
  function buildBankPicker(container) {
    var el = ui.el, esc = ui.esc;
    var wrap = el("div", "pe-bankpick");
    wrap.setAttribute("role", "group");
    wrap.setAttribute("aria-label", "Question bank");
    wrap.appendChild(el("span", "pe-bankpick-label", "Question bank"));
    var group = el("div", "pe-bankpick-btns");
    wrap.appendChild(group);
    var active = window.NSTBank.active() || "";
    window.NSTBank.list().then(function (banks) {
      group.innerHTML = "";
      if (!banks.length) { group.appendChild(el("span", "pe-bankpick-empty", "No banks available.")); return; }
      banks.forEach(function (b) {
        var on = b.id === active;
        var btn = el("button", "pe-bankbtn" + (on ? " on" : ""), esc(b.title || b.cert || b.id));
        btn.type = "button";
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.addEventListener("click", function () {
          if (b.id !== (window.NSTBank.active() || "")) switchBank(b.id, container);
        });
        group.appendChild(btn);
      });
    });
    return wrap;
  }

  /* (v2.48.0) Why there are no questions — when there is a reason beyond "nobody has
   * chosen one". The loader records a failed manifest fetch and a failed bank-file
   * fetch; this page showed the same empty state for both, and for neither. */
  function bankProblem() {
    var B = window.NSTBank;
    if (!B) return null;
    if (B.loadError && B.loadError()) return "bank";
    if (B.manifestError && B.manifestError()) return "manifest";
    return null;
  }

  /* Re-fetch whatever failed, then re-render. The manifest is refetched only when IT
   * was the thing that failed: manifest() caches the empty result of a failed fetch, so
   * without force=true a retry would resolve null off the cache and try nothing. */
  function reloadBank(container) {
    var B = window.NSTBank;
    container.innerHTML = '<div class="pe-loading">Loading question bank…</div>';
    function done(bank) {
      window.STARNIX_QUESTIONS = (bank && bank.questions.length) ? B.toStarNix(bank) : { questions: [] };
      engine.resetCache();
      showEntry(container);
    }
    var first = (B.manifestError && B.manifestError()) ? B.manifest(true) : Promise.resolve(null);
    first.then(function () { return B.load(); }).then(done).catch(function () { done(null); });
  }

  // Switch the active bank, reload it, and re-render the entry screen with the new counts.
  function switchBank(id, container) {
    window.NSTBank.setActive(id || null);
    reloadBank(container);
  }

  function showNoBank(container) {
    var el = ui.el;
    container.innerHTML = "";
    var root = el("div", "pe-entry");
    var header = el("div", "pe-entry-head");
    var back = el("a", "pe-back", "&#8592; Main menu");
    back.href = HOME;
    header.appendChild(back);
    header.appendChild(el("h1", "pe-entry-title", "Nutanix Practice Exams"));
    root.appendChild(header);
    var box = el("div", "pe-nobank");
    box.appendChild(el("h2", null, "No question bank loaded"));
    box.appendChild(el("p", null, "Choose a question bank from the launcher (Settings → Question bank), then come back. Banks live in /banks/ — see banks/README.md to add one."));
    var cta = el("a", "pe-btn pe-btn-primary", "Choose a bank →");
    cta.href = HOME;
    box.appendChild(cta);
    root.appendChild(box);
    container.appendChild(root);
  }

  /* This is the page where answers are actually given, so it is the page that
   * most needs to say when they are not being kept. A banner rather than a chip:
   * someone mid-exam should not have to notice a small badge to learn that the
   * last forty minutes will not survive closing the tab.
   *
   * It is rendered above the view and never inside it, so changing screens does
   * not wipe it -- every mode replaces the contents of #pe-root. */
  function watchStorage() {
    window.addEventListener("nst-storage-status", function (ev) {
      var d = (ev && ev.detail) || {};
      var existing = document.getElementById("pe-store-warn");
      if (d.ok) { if (existing) existing.remove(); return; }
      if (existing) return;
      var root = document.getElementById("pe-root");
      if (!root || !root.parentNode) return;
      var bar = document.createElement("div");
      bar.id = "pe-store-warn";
      bar.className = "pe-storewarn";
      bar.setAttribute("role", "alert");
      bar.textContent = (d.reason === "quota"
        ? "This browser's storage is full — your answers are not being saved."
        : "This browser is refusing to store data — your answers are not being saved.")
        + " They will be lost when you close this tab. Open the launcher and use"
        + " Settings → Save backup file, which writes a file instead.";
      root.parentNode.insertBefore(bar, root);
    });
  }

  /* (v2.41.0) Sync trouble, said out loud HERE too.
   *
   * The launcher already warns when a push keeps failing. Practice Exams loads
   * nst-sync.js -- so sync runs, and can fail, on this page -- and listened for
   * nothing. The warning existed only on the page you are not on while you are
   * studying, which is the whole of the time it matters.
   *
   * The comment above watchStorage makes the argument for the other warning and
   * it is the same one: someone mid-exam should not have to go and look
   * somewhere else to learn that the last forty minutes are not reaching their
   * account. NSTSync fires this only when the state changes, so a healthy
   * session shows nothing at all.
   *
   * Deliberately gentler than the storage banner. Nothing is lost here: the work
   * is in this browser and will be pushed when the connection comes back. Saying
   * that in the red reserved for "your answers are not being saved" would teach
   * people to ignore the red. */
  function watchSync() {
    window.addEventListener("nst-sync-status", function (ev) {
      var d = (ev && ev.detail) || {};
      var existing = document.getElementById("pe-sync-warn");
      if (d.ok) { if (existing) existing.remove(); return; }
      if (existing) return;
      var root = document.getElementById("pe-root");
      if (!root || !root.parentNode) return;
      var bar = document.createElement("div");
      bar.id = "pe-sync-warn";
      bar.className = "pe-syncwarn";
      bar.setAttribute("role", "status");
      bar.textContent = "Your progress isn't reaching your account"
        + (d.error ? " (" + d.error + ")" : "")
        + ". It's still safe in this browser, and will sync when the connection"
        + " comes back. Nothing you answer here is lost.";
      root.parentNode.insertBefore(bar, root);
    });
  }

  function boot() {
    var container = document.getElementById("pe-root");
    if (!container) return;
    watchStorage();
    watchSync();
    container.innerHTML = '<div class="pe-loading">Loading…</div>';
    // If the manifest has any banks, always render the entry screen (it carries the bank
    // picker, so the player can switch banks here). Only a truly empty manifest is a dead end.
    window.NSTBank.list().then(function (banks) {
      // An empty list because the fetch failed is not the same as a manifest with no
      // banks in it. Only the second is the "nothing is configured" dead end.
      if ((!banks || !banks.length) && !bankProblem()) { showNoBank(container); return; }
      window.NSTBank.load().then(function (bank) {
        if (bank && bank.questions.length) {
          window.STARNIX_QUESTIONS = window.NSTBank.toStarNix(bank);
          engine.resetCache();
        }
        showEntry(container);
      }).catch(function () { showEntry(container); });
    }).catch(function () { showNoBank(container); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  PE.app = { showEntry: showEntry };
})();
