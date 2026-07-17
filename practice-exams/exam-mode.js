/* Nutanix Practice Exams — Exam Mode.
 * Timed, randomized question + option order, NO feedback until submission.
 * Flag-for-review, question palette, auto-submit when the clock hits zero,
 * pass/fail against the 80% bar, then the shared results + review screen. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var ui = PE.ui, engine = PE.engine;

  function start(container, opts) {
    opts = opts || {};
    var el = ui.el, esc = ui.esc, cfg = window.PE_CONFIG;
    var questions = engine.buildExam(opts.count);
    var N = questions.length;
    var idx = 0;
    var answers = questions.map(function () { return null; });
    var flags = questions.map(function () { return false; });
    // Scale the time limit to the number of questions (constant per-question budget).
    var limitMin = Math.round(cfg.EXAM_TIME_LIMIT_MIN * N / cfg.EXAM_QUESTION_COUNT);
    var endTime = Date.now() + limitMin * 60 * 1000;
    var timerId = null;
    var finished = false;

    var root = el("div", "pe-mode pe-exam");
    root.innerHTML =
      '<div class="pe-bar">' +
        '<button type="button" class="pe-btn pe-btn-ghost pe-exit">&#8592; Exit</button>' +
        '<div class="pe-bar-title">Exam Mode</div>' +
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
      '<p class="pe-keys" aria-hidden="true"><kbd>A</kbd>–<kbd>D</kbd> select · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>F</kbd> flag</p>';
    container.innerHTML = "";
    container.appendChild(root);

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
        stopTimer(); opts.onExit && opts.onExit();
      });
    });
    prevBtn.addEventListener("click", function () { if (idx > 0) { idx--; renderCard(); } });
    nextBtn.addEventListener("click", function () { if (idx < N - 1) { idx++; renderCard(); } });
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
    // red at 10% — plus one polite screen-reader announcement at each crossing.
    var totalMs = limitMin * 60 * 1000;
    var announced = { warn: false, danger: false };
    function tick() {
      var rem = endTime - Date.now();
      timerEl.innerHTML = ui.ICONS.clock + "<span>" + fmt(rem) + "</span>";
      var frac = rem / totalMs;
      var danger = frac <= 0.10, warn = frac <= 0.25;
      timerEl.classList.toggle("low", warn && !danger);
      timerEl.classList.toggle("danger", danger);
      if (warn && !announced.warn) {
        announced.warn = true;
        timerEl.setAttribute("aria-live", "polite");
        timerEl.setAttribute("aria-label", "Timer: " + fmt(rem) + " remaining — a quarter of the time left");
      }
      if (danger && !announced.danger) {
        announced.danger = true;
        timerEl.setAttribute("aria-label", "Timer: " + fmt(rem) + " remaining — running out of time");
      }
      if (rem <= 0) { stopTimer(); doSubmit(true); }
    }
    function startTimer() { tick(); timerId = setInterval(tick, 1000); }
    function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

    function buildPalette() {
      paletteEl.innerHTML = "";
      questions.forEach(function (q, i) {
        var cls = "pe-pal";
        if (i === idx) cls += " current";
        if (engine.isAnswered(answers[i])) cls += " answered";
        if (flags[i]) cls += " flagged";
        var b = el("button", cls, String(i + 1));
        b.type = "button";
        b.setAttribute("aria-label", "Question " + (i + 1)
          + (engine.isAnswered(answers[i]) ? ", answered" : ", not answered") + (flags[i] ? ", flagged" : ""));
        b.addEventListener("click", function () { idx = i; renderCard(); });
        paletteEl.appendChild(b);
      });
      ui.centerPalette(paletteEl);
    }

    function renderCard() {
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
      nextBtn.disabled = idx === N - 1;
      // (UI) the bar now shows real progress — answered share fills it, and a thin tick
      // marks where you're currently positioned in the set.
      progFill.style.width = (answeredCount() / N * 100) + "%";
      var posT = root.querySelector(".pe-progress-pos");
      if (posT) posT.style.left = (((idx + 1) / N) * 100) + "%";
      progMeta.textContent = "Question " + (idx + 1) + " of " + N + " · " + answeredCount() + " answered";
      buildPalette();
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
      var results = questions.map(function (q, i) {
        return { q: q, chosen: answers[i], correct: engine.gradeAnswer(q, answers[i]) };
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
      });
      PE.results.render(container, summary, {
        timedOut: timedOut,
        onRetake: function () { start(container, opts); },
        onHome: function () { opts.onHome && opts.onHome(); },
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
    renderCard();
  }

  PE.exam = { start: start };
})();
