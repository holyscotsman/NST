/* Nutanix Practice Exams — Practice Mode.
 * Instant per-question feedback, unlimited retries, free navigation, no timer,
 * running score. Study-focused: read the explanation, move at your own pace. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var ui = PE.ui, engine = PE.engine;

  function start(container, opts) {
    opts = opts || {};
    var el = ui.el, esc = ui.esc;
    var questions = engine.buildPractice(opts.count);
    var N = questions.length;
    var idx = 0;
    // per-index state: { chosen:(number|number[]|null), checked:bool, correct:bool }
    var state = questions.map(function () { return { chosen: null, checked: false, correct: false }; });

    var root = el("div", "pe-mode pe-practice");
    root.innerHTML =
      '<div class="pe-bar">' +
        '<button type="button" class="pe-btn pe-btn-ghost pe-exit">&#8592; Modes</button>' +
        '<div class="pe-bar-title">Practice Mode</div>' +
        '<div class="pe-score-chip" aria-live="polite"></div>' +
      '</div>' +
      '<div class="pe-progress"><div class="pe-progress-bar"><span></span><i class="pe-progress-pos"></i></div><div class="pe-progress-meta"></div></div>' +
      '<div class="pe-palette" role="group" aria-label="Jump to question"></div>' +
      '<div class="pe-card"></div>' +
      '<div class="pe-foot">' +
        '<button type="button" class="pe-btn pe-btn-ghost pe-prev">Prev</button>' +
        '<button type="button" class="pe-btn pe-btn-primary pe-check">Check answer</button>' +
        '<button type="button" class="pe-btn pe-btn-ghost pe-next">Next</button>' +
      '</div>' +
      '<p class="pe-keys" aria-hidden="true"><kbd>A</kbd>–<kbd>D</kbd> select · <kbd>←</kbd><kbd>→</kbd> navigate · <kbd>Enter</kbd> check</p>';
    container.innerHTML = "";
    container.appendChild(root);

    var cardEl = root.querySelector(".pe-card");
    var paletteEl = root.querySelector(".pe-palette");
    var scoreChip = root.querySelector(".pe-score-chip");
    var progFill = root.querySelector(".pe-progress-bar span");
    var progMeta = root.querySelector(".pe-progress-meta");
    var checkBtn = root.querySelector(".pe-check");
    var prevBtn = root.querySelector(".pe-prev");
    var nextBtn = root.querySelector(".pe-next");

    root.querySelector(".pe-exit").addEventListener("click", function () {
      if (PE.sfx && PE.sfx.ambientStop) PE.sfx.ambientStop();
      opts.onExit && opts.onExit();
    });
    // (M1) opt-in study ambience for Practice mode only (entry click is the gesture).
    if (PE.sfx && PE.sfx.ambientStart) PE.sfx.ambientStart();
    prevBtn.addEventListener("click", function () { if (idx > 0) { idx--; renderCard(); } });
    nextBtn.addEventListener("click", function () { if (idx < N - 1) { idx++; renderCard(); } });
    checkBtn.addEventListener("click", onCheckOrRetry);

    // (UI) keyboard play: A-D (or 1-9) selects, ←/→ navigates, Enter checks. The listener
    // self-removes once this mode's DOM is replaced (root disconnects).
    function onKey(e) {
      if (!root.isConnected) {
        document.removeEventListener("keydown", onKey);
        if (PE.sfx && PE.sfx.ambientStop) PE.sfx.ambientStop();   // safety net for non-exit navigation
        return;
      }
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      var q = questions[idx], k = e.key;
      var li = "abcdefghij".indexOf(k.toLowerCase());
      var ni = "123456789".indexOf(k);
      if (li >= 0 && li < q.options.length) { e.preventDefault(); selectOption(li); }
      else if (ni >= 0 && ni < q.options.length) { e.preventDefault(); selectOption(ni); }
      else if (k === "ArrowLeft" && idx > 0) { e.preventDefault(); idx--; renderCard(); }
      else if (k === "ArrowRight" && idx < N - 1) { e.preventDefault(); idx++; renderCard(); }
      else if (k === "Enter" && !checkBtn.disabled && tag !== "BUTTON") { e.preventDefault(); onCheckOrRetry(); }
    }
    document.addEventListener("keydown", onKey);

    function answeredCount() { var n = 0; state.forEach(function (s) { if (s.checked) n++; }); return n; }
    function correctCount() { var n = 0; state.forEach(function (s) { if (s.checked && s.correct) n++; }); return n; }

    // Study streak: consecutive correct checks reward momentum. Shown from 3 up so the
    // chip stays quiet during warm-up; any miss resets it.
    var streak = 0;
    function updateScore() {
      var s = correctCount() + " correct · " + answeredCount() + " answered";
      if (streak >= 3) s += " · 🔥 " + streak + " streak";
      scoreChip.textContent = s;
    }

    function buildPalette() {
      paletteEl.innerHTML = "";
      questions.forEach(function (q, i) {
        var st = state[i];
        var cls = "pe-pal";
        if (i === idx) cls += " current";
        if (st.checked) cls += st.correct ? " ok" : " bad";
        var b = el("button", cls, String(i + 1));
        b.type = "button";
        b.setAttribute("aria-label", "Question " + (i + 1) + (st.checked ? (st.correct ? ", correct" : ", incorrect") : ", not answered"));
        b.addEventListener("click", function () { idx = i; renderCard(); });
        paletteEl.appendChild(b);
      });
      ui.centerPalette(paletteEl);
    }

    function selectOption(i) {
      var st = state[idx];
      if (st.checked) return;              // locked until "Try again"
      var q = questions[idx];
      if (engine.isMulti(q)) {
        var arr = Array.isArray(st.chosen) ? st.chosen.slice() : [];
        var at = arr.indexOf(i);
        if (at >= 0) arr.splice(at, 1); else arr.push(i);
        st.chosen = arr;
      } else {
        st.chosen = i;
      }
      if (PE.sfx) PE.sfx.play("select");
      renderCard();
    }

    function onCheckOrRetry() {
      var st = state[idx];
      if (st.checked) {                    // "Try again" — clear and re-answer
        st.checked = false; st.correct = false; st.chosen = null;
        renderCard();
        return;
      }
      var q = questions[idx];
      if (!engine.isAnswered(st.chosen)) return;
      st.checked = true;
      st.correct = engine.gradeAnswer(q, st.chosen);
      streak = st.correct ? streak + 1 : 0;
      if (PE.sfx) PE.sfx.play(st.correct ? "correct" : "incorrect");
      updateScore();
      renderCard();
    }

    function renderCard() {
      var q = questions[idx];
      var st = state[idx];
      var chosen = Array.isArray(st.chosen) ? st.chosen : (st.chosen == null ? [] : [st.chosen]);
      var cset = Array.isArray(q.correct) ? q.correct : [q.correct];
      var multi = engine.isMulti(q);
      cardEl.innerHTML = "";

      var meta = el("div", "pe-q-meta");
      if (q.domain) meta.appendChild(el("span", "pe-chip", esc(q.domain)));
      if (multi) meta.appendChild(el("span", "pe-chip pe-chip-multi", "Select " + q.correct.length));
      cardEl.appendChild(meta);

      cardEl.appendChild(el("p", "pe-q-prompt", esc(q.prompt)));
      var ex = ui.exhibit(q);
      if (ex) cardEl.appendChild(ex);

      var optsHost = el("div", "pe-opts");
      optsHost.setAttribute("role", multi ? "group" : "radiogroup");
      q.options.forEach(function (text, i) {
        var fb = null;
        if (st.checked) fb = { chosen: chosen.indexOf(i) >= 0, correct: cset.indexOf(i) >= 0, note: q.optionNotes ? q.optionNotes[i] : "" };
        optsHost.appendChild(ui.option(
          { index: i, text: text, selected: chosen.indexOf(i) >= 0, multi: multi, onToggle: selectOption },
          fb
        ));
      });
      cardEl.appendChild(optsHost);

      if (st.checked) {
        var verdict = el("div", "pe-verdict " + (st.correct ? "ok" : "bad"));
        verdict.innerHTML = (st.correct ? ui.ICONS.check + "<span>Correct</span>" : ui.ICONS.x + "<span>Not quite</span>");
        cardEl.appendChild(verdict);
        if (q.explanation) {
          var exp = el("div", "pe-explain");
          exp.appendChild(el("span", "pe-explain-label", "Explanation"));
          exp.appendChild(el("p", null, esc(q.explanation)));
          cardEl.appendChild(exp);
        }
      }

      // Footer state
      checkBtn.textContent = st.checked ? "Try again" : "Check answer";
      checkBtn.classList.toggle("pe-btn-ghost", st.checked);
      checkBtn.classList.toggle("pe-btn-primary", !st.checked);
      checkBtn.disabled = !st.checked && !engine.isAnswered(st.chosen);
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === N - 1;

      // (UI) answered share fills the bar; the thin tick is your position in the set.
      progFill.style.width = (answeredCount() / N * 100) + "%";
      var posT = root.querySelector(".pe-progress-pos");
      if (posT) posT.style.left = (((idx + 1) / N) * 100) + "%";
      progMeta.textContent = "Question " + (idx + 1) + " of " + N;
      buildPalette();
      updateScore();
      try { cardEl.scrollIntoView({ block: "nearest" }); } catch (e) {}
    }

    updateScore();
    renderCard();
  }

  PE.practice = { start: start };
})();
