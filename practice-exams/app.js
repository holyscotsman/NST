/* Nutanix Practice Exams — app shell.
 * Entry screen: choose Practice Mode or Exam Mode, see exam parameters and
 * recent attempts. Routes into the chosen mode and back. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var ui = PE.ui, engine = PE.engine;
  var HOME = "../";  // back to the NST launcher

  function fmtDate(ms) {
    try {
      var d = new Date(ms);
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) + " " +
             d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  function showEntry(container) {
    var el = ui.el, esc = ui.esc, cfg = window.PE_CONFIG;
    var meta = engine.bankMeta();
    var randomCount = Math.min(cfg.EXAM_QUESTION_COUNT, meta.total);
    var passN = Math.round(cfg.PASS_THRESHOLD * 100);
    var useFull = false;   // question-set choice: false = 75 random, true = full bank
    container.innerHTML = "";
    var root = el("div", "pe-entry");

    // Header
    var header = el("div", "pe-entry-head");
    var back = el("a", "pe-back", "&#8592; Nutanix Study Tool");
    back.href = HOME;
    header.appendChild(back);
    header.appendChild(el("h1", "pe-entry-title", "Nutanix Practice Exams"));
    header.appendChild(el("p", "pe-entry-sub",
      esc(meta.name) + " · " + meta.total + " questions in the bank"));
    root.appendChild(header);

    // Question-set picker (applies to whichever mode you start)
    var pick = el("div", "pe-setpick");
    pick.setAttribute("role", "radiogroup");
    pick.setAttribute("aria-label", "Question set");
    pick.appendChild(el("span", "pe-setpick-label", "Question set"));
    var segRandom = el("button", "pe-seg on", randomCount + " random");
    var segFull = el("button", "pe-seg", "Full bank · " + meta.total);
    [segRandom, segFull].forEach(function (b) { b.type = "button"; b.setAttribute("role", "radio"); });
    segRandom.setAttribute("aria-checked", "true");
    segFull.setAttribute("aria-checked", "false");
    function selectSet(full) {
      useFull = full;
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

    function chosenCount() { return useFull ? meta.total : randomCount; }
    function examMinutes() { return Math.round(cfg.EXAM_TIME_LIMIT_MIN * chosenCount() / cfg.EXAM_QUESTION_COUNT); }

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
    pcard.addEventListener("click", function () { launch("practice", container, chosenCount()); });
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
        row.appendChild(el("span", "pe-history-score", a.pct + "% · " + a.correct + "/" + a.total));
        row.appendChild(el("span", "pe-history-date", fmtDate(a.at) + (a.timedOut ? " · timed out" : "")));
        list.appendChild(row);
      });
      root.appendChild(list);
    }

    container.appendChild(root);
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function launch(mode, container, count) {
    var opts = {
      count: count,
      onExit: function () { showEntry(container); },
      onHome: function () { window.location.href = HOME; },
    };
    if (mode === "practice") PE.practice.start(container, opts);
    else PE.exam.start(container, opts);
  }

  function showNoBank(container) {
    var el = ui.el;
    container.innerHTML = "";
    var root = el("div", "pe-entry");
    var header = el("div", "pe-entry-head");
    var back = el("a", "pe-back", "&#8592; Nutanix Study Tool");
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

  function boot() {
    var container = document.getElementById("pe-root");
    if (!container) return;
    container.innerHTML = '<div class="pe-loading">Loading question bank…</div>';
    window.NSTBank.load().then(function (bank) {
      if (!bank || !bank.questions.length) { showNoBank(container); return; }
      window.STARNIX_QUESTIONS = window.NSTBank.toStarNix(bank);
      engine.resetCache();
      showEntry(container);
    }).catch(function () { showNoBank(container); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  PE.app = { showEntry: showEntry };
})();
