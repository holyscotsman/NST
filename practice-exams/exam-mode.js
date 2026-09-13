/* Nutanix Practice Exams — Exam Mode.
 * Timed, randomized question + option order, NO feedback until submission.
 * Flag-for-review, question palette, auto-submit when the clock hits zero,
 * pass/fail against the 80% bar, then the shared results + review screen. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var ui = PE.ui, engine = PE.engine;

  /* ---- surviving an interruption ------------------------------------------
   *
   * Practice Mode has always remembered where you were. Exam Mode -- the long
   * one, the timed one, the one worth ninety minutes -- remembered nothing, so a
   * phone deciding to reclaim a backgrounded tab took the whole sitting with it.
   * The beforeunload guard does not help there: a discarded tab never fires it.
   *
   * Resuming cannot become a way to stop the clock. `endTime` is an absolute
   * timestamp, so it is saved as one: the time away is spent whether the page
   * was open or not, and an exam whose time ran out while you were gone comes
   * back finished rather than fresh.
   *
   * What is stored is the ids and each question's OPTION PERMUTATION, not the
   * questions themselves -- about 2 KB for a 75-question sitting, and the only
   * thing that makes the restored answers mean what they meant. See
   * engine.applyPerm.
   */
  var EXAM_KEY = "nst.practice-exams.exam.v1";

  function readSaved() {
    try {
      var raw = window.NSTSafeParse(localStorage.getItem(EXAM_KEY));
      if (!raw || typeof raw !== "object" || !Array.isArray(raw.q)) return null;
      if (typeof raw.endTime !== "number" || !isFinite(raw.endTime)) return null;
      return raw;
    } catch (e) { return null; }
  }
  function clearSaved() { try { localStorage.removeItem(EXAM_KEY); } catch (e) {} }

  /* Something is under the key but it is not a record we can read -- corrupt
   * JSON, a shape from a future version. Remove it rather than leaving bytes
   * that will never be usable and never be offered. */
  function clearUnreadable() {
    try { if (localStorage.getItem(EXAM_KEY) !== null) localStorage.removeItem(EXAM_KEY); } catch (e) {}
  }

  /* Rebuild the sitting a saved record describes, or null if the bank can no
   * longer supply it (a bank swapped or edited under the exam). Partial
   * restoration is not offered: half an exam is not the exam. */
  function rebuild(saved) {
    var out = [];
    for (var i = 0; i < saved.q.length; i++) {
      var rec = saved.q[i];
      if (!rec || !Array.isArray(rec.perm)) return null;
      var base = engine.questionById(rec.id);
      if (!base || base.options.length !== rec.perm.length) return null;
      out.push(engine.applyPerm(base, rec.perm));
    }
    return out.length ? out : null;
  }

  PE.examResume = {
    KEY: EXAM_KEY,
    read: readSaved,
    clear: clearSaved,
    rebuild: rebuild,
    /* What the entry screen needs to offer it, or null when there is nothing to
     * offer. `expired` means the clock ran out while the page was away. */
    pending: function (bankId) {
      var raw = null;
      try { raw = localStorage.getItem(EXAM_KEY); } catch (e) { raw = null; }
      var s = readSaved();
      if (!s) {
        clearUnreadable();
        // Something WAS there and could not be read. The launcher may well have
        // advertised it -- its check is necessarily shallower, since it has no
        // engine to rebuild questions with -- and following that link to a page
        // that silently says nothing is the dead end this reports instead.
        return raw !== null ? { unusable: true } : null;
      }
      // A record for another certification is not offered, but it is not junk
      // either -- switching back should still find it. Only a record this bank
      // genuinely cannot rebuild is thrown away, so nothing dead is left sitting
      // in storage that will never be offered again.
      if (bankId && s.bank && s.bank !== bankId) return null;
      var qs = rebuild(s);
      if (!qs) { clearSaved(); return { unusable: true }; }
      var answered = 0;
      for (var i = 0; i < s.answers.length; i++) if (engine.isAnswered(s.answers[i])) answered++;
      return {
        total: qs.length, answered: answered,
        remainingMs: Math.max(0, s.endTime - Date.now()),
        expired: s.endTime <= Date.now(),
        startedAt: s.startedAt || 0,
      };
    },
  };

  function start(container, opts) {
    opts = opts || {};
    var el = ui.el, esc = ui.esc, cfg = window.PE_CONFIG;
    var resumed = opts.resume ? readSaved() : null;
    var questions = resumed ? rebuild(resumed) : null;
    if (resumed && !questions) { clearSaved(); resumed = null; }   // the bank can no longer supply it
    if (!questions) { questions = engine.buildExam(opts.count); resumed = null; }
    var N = questions.length;
    var idx = resumed ? Math.min(Math.max(0, resumed.idx | 0), N - 1) : 0;
    var answers = resumed ? resumed.answers.slice(0, N) : questions.map(function () { return null; });
    var flags = resumed ? resumed.flags.slice(0, N) : questions.map(function () { return false; });
    while (answers.length < N) answers.push(null);
    while (flags.length < N) flags.push(false);
    // Scale the time limit to the number of questions (constant per-question budget).
    var limitMin = resumed && resumed.limitMin
      ? resumed.limitMin
      : Math.round(cfg.EXAM_TIME_LIMIT_MIN * N / cfg.EXAM_QUESTION_COUNT);
    // Absolute, and kept across the interruption: the clock does not pause.
    var endTime = resumed ? resumed.endTime : Date.now() + limitMin * 60 * 1000;
    var startedAt = (resumed && resumed.startedAt) || Date.now();
    var activeBank = (window.NSTBank && window.NSTBank.active && window.NSTBank.active()) || "";

    function saveState() {
      if (finished) return;
      try {
        localStorage.setItem(EXAM_KEY, JSON.stringify({
          bank: activeBank, endTime: endTime, limitMin: limitMin,
          startedAt: startedAt, idx: idx, answers: answers, flags: flags,
          q: questions.map(function (q) { return { id: q.id, perm: q.perm }; }),
        }));
      } catch (e) { /* storage refused: the sitting still runs, it just cannot be resumed */ }
    }
    var timerId = null;
    var finished = false;

    // (C1-05) an in-progress timed sitting must not be lost to a reflexive
    // refresh/back-swipe/close — the browser asks first. The guard is dropped
    // on submit and on a confirmed exit, so finished exams never nag.
    function guardUnload(e) { e.preventDefault(); e.returnValue = ""; }
    function dropGuard() { window.removeEventListener("beforeunload", guardUnload); }
    window.addEventListener("beforeunload", guardUnload);

    var root = el("div", "pe-mode pe-exam");
    root.innerHTML =
      '<div class="pe-bar">' +
        '<button type="button" class="pe-btn pe-btn-ghost pe-exit">&#8592; Exit</button>' +
        '<h1 class="pe-bar-title">Exam Mode</h1>' +
        '<div class="pe-timer" role="timer" aria-live="off"></div>' +
      '</div>' +
      '<div class="pe-progress"><div class="pe-progress-bar"><span></span><i class="pe-progress-pos"></i></div><div class="pe-progress-meta"></div></div>' +
      '<div class="pe-palette" role="group" aria-label="Jump to question"></div>' +
      '<div class="pe-card"></div>' +
      '<div class="pe-foot">' +
        '<button type="button" class="pe-btn pe-btn-ghost pe-prev">Prev</button>' +
        '<button type="button" class="pe-btn pe-btn-flag">&#9873; Flag</button>' +
        '<button type="button" class="pe-btn pe-btn-primary pe-next">Next</button>' +
      '</div>' +
      '<div class="pe-foot pe-foot-submit"><button type="button" class="pe-btn pe-btn-submit">Submit exam</button></div>' +
      '<p class="pe-keys" aria-hidden="true"><kbd>A</kbd>–<kbd>' + ui.lastOptKey(questions) + '</kbd> select · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>F</kbd> flag</p>';
    container.innerHTML = "";
    container.appendChild(root);
    // The old view took the keyboard's place with it; put it at the top of this one.
    ui.focusView(root, ".pe-bar-title");

    var cardEl = root.querySelector(".pe-card");
    var paletteEl = root.querySelector(".pe-palette");
    var timerEl = root.querySelector(".pe-timer");
    var progFill = root.querySelector(".pe-progress-bar span");
    var progMeta = root.querySelector(".pe-progress-meta");
    var prevBtn = root.querySelector(".pe-prev");
    var nextBtn = root.querySelector(".pe-next");
    var flagBtn = root.querySelector(".pe-btn-flag");
    var submitBtn = root.querySelector(".pe-btn-submit");

    root.querySelector(".pe-exit").addEventListener("click", function () {
      confirmModal("Leave the exam?", "Your progress will be discarded and the exam will not be scored.", "Leave", function () {
        stopTimer(); dropGuard(); opts.onExit && opts.onExit();
      });
    });
    prevBtn.addEventListener("click", function () { if (idx > 0) { idx--; renderCard(); } });
    nextBtn.addEventListener("click", function () { if (idx < N - 1) { idx++; renderCard(); } else promptSubmit(); });
    flagBtn.addEventListener("click", function () { flags[idx] = !flags[idx]; if (PE.sfx) PE.sfx.play("flag"); renderCard(); });
    submitBtn.addEventListener("click", function () { promptSubmit(); });

    // (UI) keyboard play: A-D/1-9 selects, ←/→ navigates, F flags. Self-removes when the
    // exam DOM is replaced; inert while the confirm modal is open (it owns focus).
    function onKey(e) {
      if (!root.isConnected) { document.removeEventListener("keydown", onKey); return; }
      if (finished || e.altKey || e.ctrlKey || e.metaKey) return;
      if (root.querySelector(".pe-modal-overlay")) return;
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      var q = questions[idx], k = e.key;
      var li = "abcdefghij".indexOf(k.toLowerCase());
      var ni = "123456789".indexOf(k);
      if (k.toLowerCase() === "f") { e.preventDefault(); flags[idx] = !flags[idx]; if (PE.sfx) PE.sfx.play("flag"); renderCard(); }
      else if (li >= 0 && li < q.options.length) { e.preventDefault(); selectOption(li); }
      else if (ni >= 0 && ni < q.options.length) { e.preventDefault(); selectOption(ni); }
      else if (k === "ArrowLeft" && idx > 0) { e.preventDefault(); idx--; renderCard(); }
      else if (k === "ArrowRight" && idx < N - 1) { e.preventDefault(); idx++; renderCard(); }
    }
    document.addEventListener("keydown", onKey);

    function selectOption(i) {
      var q = questions[idx];
      if (engine.isMulti(q)) {
        var arr = Array.isArray(answers[idx]) ? answers[idx].slice() : [];
        var at = arr.indexOf(i);
        if (at >= 0) arr.splice(at, 1); else arr.push(i);
        answers[idx] = arr.length ? arr : null;
      } else {
        answers[idx] = i;
      }
      if (PE.sfx) PE.sfx.play("select");
      renderCard();
    }

    function answeredCount() { var n = 0; answers.forEach(function (a) { if (engine.isAnswered(a)) n++; }); return n; }
    function flaggedCount() { var n = 0; flags.forEach(function (f) { if (f) n++; }); return n; }

    /* ---- timer ---- */
    function fmt(ms) {
      var s = Math.max(0, Math.round(ms / 1000));
      var m = Math.floor(s / 60), ss = s % 60;
      return m + ":" + (ss < 10 ? "0" : "") + ss;
    }
    // (UI) urgency thresholds derive from the whole sitting: amber at 25% remaining,
    // red at 10%. (C2-05) announcements go through a dedicated visually-hidden
    // live region written ONCE per crossing — flipping aria-live on the timer
    // itself made screen readers announce every per-second innerHTML rewrite.
    var totalMs = limitMin * 60 * 1000;
    var announced = { warn: false, danger: false };
    var srTimer = el("div", "pe-sr-only");
    srTimer.setAttribute("aria-live", "polite");
    srTimer.setAttribute("aria-atomic", "true");
    root.appendChild(srTimer);
    function tick() {
      var rem = endTime - Date.now();
      timerEl.innerHTML = ui.ICONS.clock + "<span>" + fmt(rem) + "</span>";
      var frac = rem / totalMs;
      var danger = frac <= 0.10, warn = frac <= 0.25;
      timerEl.classList.toggle("low", warn && !danger);
      timerEl.classList.toggle("danger", danger);
      if (warn && !announced.warn) {
        announced.warn = true;
        srTimer.textContent = fmt(rem) + " remaining — a quarter of the time left.";
      }
      if (danger && !announced.danger) {
        announced.danger = true;
        srTimer.textContent = fmt(rem) + " remaining — running out of time.";
      }
      if (rem <= 0) { stopTimer(); doSubmit(true); }
    }
    function startTimer() { tick(); timerId = setInterval(tick, 1000); }
    function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

    // (C3-02) built once, updated in place — the old wipe-and-recreate of up to
    // 75 chips on every selection/navigation/flag threw an activating keyboard
    // user's focus to <body>.
    var palChips = null;
    /* (v2.59.0) Which chip the strip is currently scrolled to.
     *
     * `centerPalette` used to be called only from `buildPalette`, which runs
     * ONCE -- at which point the current question is #1 and the strip is
     * already at scrollLeft 0. It was a no-op every time it ran, and never ran
     * when it would have done something. On question 75 of 75 the palette still
     * showed 1-21 on a 1280px desktop and 1-9 on a phone: the map of where you
     * are, parked at the beginning, during a timed exam.
     *
     * Re-centering on every update is what C3-01 removed, and rightly -- it
     * yanks the strip back to the current chip while you are scrolling it to
     * find a flagged one. So centre exactly when the current question CHANGES,
     * which is the only moment the window can be wrong. Answering and flagging
     * leave the scroll position alone. */
    var palCentered = -1;
    function buildPalette() {
      paletteEl.innerHTML = "";
      palChips = questions.map(function (q, i) {
        var b = el("button", "pe-pal", String(i + 1));
        b.type = "button";
        b.addEventListener("click", function () { idx = i; renderCard(); });
        paletteEl.appendChild(b);
        return b;
      });
      updatePalette();
    }
    function updatePalette() {
      if (!palChips) return;
      palChips.forEach(function (b, i) {
        var cls = "pe-pal";
        if (i === idx) cls += " current";
        if (engine.isAnswered(answers[i])) cls += " answered";
        if (flags[i]) cls += " flagged";
        b.className = cls;
        if (i === idx) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current");   // (C7-04)
        b.setAttribute("aria-label", "Question " + (i + 1)
          + (engine.isAnswered(answers[i]) ? ", answered" : ", not answered") + (flags[i] ? ", flagged" : ""));
      });
      if (palCentered !== idx) { ui.centerPalette(paletteEl); palCentered = idx; }
    }

    /* Every answer, flag and navigation already ends here, so this is the one
     * place the sitting needs saving from. Seven call sites would each have to
     * remember; this cannot be forgotten by a later change. */
    function renderCard() {
      saveState();
      var q = questions[idx];
      var chosen = Array.isArray(answers[idx]) ? answers[idx] : (answers[idx] == null ? [] : [answers[idx]]);
      var multi = engine.isMulti(q);
      cardEl.innerHTML = "";

      var meta = el("div", "pe-q-meta");
      if (q.domain) meta.appendChild(el("span", "pe-chip", esc(q.domain)));
      if (multi) meta.appendChild(el("span", "pe-chip pe-chip-multi", "Select " + q.correct.length));
      if (flags[idx]) meta.appendChild(el("span", "pe-chip pe-chip-flag", "Flagged"));
      cardEl.appendChild(meta);

      cardEl.appendChild(el("p", "pe-q-prompt", esc(q.prompt)));
      var ex = ui.exhibit(q);
      if (ex) cardEl.appendChild(ex);

      var optsHost = el("div", "pe-opts");
      optsHost.setAttribute("role", multi ? "group" : "radiogroup");
      q.options.forEach(function (text, i) {
        optsHost.appendChild(ui.option({ index: i, text: text, selected: chosen.indexOf(i) >= 0, multi: multi, onToggle: selectOption }, null));
      });
      cardEl.appendChild(optsHost);

      flagBtn.classList.toggle("on", !!flags[idx]);
      flagBtn.innerHTML = (flags[idx] ? "&#9873; Flagged" : "&#9873; Flag");
      prevBtn.disabled = idx === 0;
      // (C2-10) the forward flow never dead-ends: on the last question the Next
      // button becomes the submit entry (promptSubmit already summarizes
      // unanswered/flagged and offers "Review flagged first").
      nextBtn.disabled = false;
      nextBtn.textContent = idx === N - 1 ? "Review & submit" : "Next";
      // (UI) the bar now shows real progress — answered share fills it, and a thin tick
      // marks where you're currently positioned in the set.
      progFill.style.width = (answeredCount() / N * 100) + "%";
      var posT = root.querySelector(".pe-progress-pos");
      if (posT) posT.style.left = (((idx + 1) / N) * 100) + "%";
      progMeta.textContent = "Question " + (idx + 1) + " of " + N + " · " + answeredCount() + " answered";
      updatePalette();   // (C3-02) chips update in place
      try { cardEl.scrollIntoView({ block: "nearest" }); } catch (e) {}
    }

    // Jump to the next flagged question (wrapping), so "review flagged" is one click.
    function jumpToFlagged() {
      for (var s = 1; s <= N; s++) {
        var j = (idx + s) % N;
        if (flags[j]) { idx = j; renderCard(); return; }
      }
    }

    function promptSubmit() {
      var unanswered = N - answeredCount();
      var flagged = flaggedCount();
      var msg = answeredCount() + " of " + N + " answered"
        + (unanswered ? " · " + unanswered + " unanswered" : "")
        + (flagged ? " · " + flagged + " flagged" : "") + ".";
      confirmModal("Submit exam?", msg + " You can't change answers after submitting.", "Submit",
        function () { doSubmit(false); },
        flagged ? { label: "Review flagged first", onClick: jumpToFlagged } : null);
    }

    function doSubmit(timedOut) {
      if (finished) return;
      finished = true;
      stopTimer();
      dropGuard();
      clearSaved();      // a graded sitting is over; nothing left to resume
      // (C4-04) how long the sitting actually took (clamped to the limit)
      var usedMs = Math.min(totalMs, totalMs - Math.max(0, endTime - Date.now()));
      var results = questions.map(function (q, i) {
        return { q: q, chosen: answers[i], correct: engine.gradeAnswer(q, answers[i]) };
      });
      // (v2.7.0) feed the shared mastery store, but only for questions actually
      // ANSWERED -- a skipped question is no evidence either way, and marking it
      // wrong would demote work the player never got the chance to do.
      results.forEach(function (r) {
        if (engine.isAnswered(r.chosen)) engine.recordMastery(r.q, r.correct);
      });
      var summary = engine.summarize(results);
      if (PE.sfx) PE.sfx.play(summary.pass ? "pass" : "fail");
      engine.saveAttempt({
        mode: "exam",
        at: Date.now(),
        pct: summary.pct,
        pass: summary.pass,
        correct: summary.correct,
        total: summary.total,
        timedOut: !!timedOut,
        durationMs: usedMs,
      });
      PE.results.render(container, summary, {
        timedOut: timedOut,
        timeUsedMs: usedMs,
        limitMs: totalMs,
        onRetake: function () { start(container, opts); },
        onHome: function () { opts.onHome && opts.onHome(); },
        // (C8-06) the misses become the next study session: Practice Mode
        // over exactly the questions this sitting got wrong.
        onPracticeMisses: function (missed) {
          PE.practice.start(container, { questions: missed, onExit: opts.onExit, onHome: opts.onHome });
        },
      });
    }

    /* ---- tiny confirm modal (optional extra action, e.g. "Review flagged first") ---- */
    function confirmModal(title, body, confirmLabel, onConfirm, extra) {
      var overlay = el("div", "pe-modal-overlay");
      var modal = el("div", "pe-modal");
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.appendChild(el("h3", "pe-modal-title", esc(title)));
      modal.appendChild(el("p", "pe-modal-body", esc(body)));
      var row = el("div", "pe-modal-actions");
      var cancel = el("button", "pe-btn pe-btn-ghost", "Cancel");
      cancel.type = "button";
      var ok = el("button", "pe-btn pe-btn-primary", confirmLabel);
      ok.type = "button";
      // (QA/a11y) dialog contract: Escape cancels, Tab stays inside, and focus
      // returns to whatever opened the dialog once it closes.
      var opener = document.activeElement;
      function close() {
        try { overlay.remove(); } catch (e) {}
        document.removeEventListener("keydown", onModalKey, true);
        if (opener && opener.focus) { try { opener.focus(); } catch (e2) {} }
      }
      function onModalKey(e) {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(); return; }
        if (e.key !== "Tab") return;
        var items = modal.querySelectorAll("button");
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      document.addEventListener("keydown", onModalKey, true);
      cancel.addEventListener("click", close);
      ok.addEventListener("click", function () { close(); onConfirm(); });
      overlay.addEventListener("click", function (e) { if (e.target === overlay) close(); });
      row.appendChild(cancel);
      if (extra) {
        var xb = el("button", "pe-btn pe-btn-ghost", esc(extra.label));
        xb.type = "button";
        xb.addEventListener("click", function () { close(); extra.onClick(); });
        row.appendChild(xb);
      }
      row.appendChild(ok);
      modal.appendChild(row);
      overlay.appendChild(modal);
      root.appendChild(overlay);
      ok.focus();
    }

    startTimer();
    buildPalette();
    renderCard();
  }

  PE.exam = { start: start };
})();
