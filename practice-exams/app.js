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
    var examCount = Math.min(cfg.EXAM_QUESTION_COUNT, meta.total);
    var passN = Math.round(cfg.PASS_THRESHOLD * 100);
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

    // Mode cards
    var modes = el("div", "pe-modes");

    var pcard = el("button", "pe-modecard pe-modecard-practice");
    pcard.type = "button";
    pcard.innerHTML =
      '<div class="pe-modecard-tag">PRACTICE</div>' +
      '<h2 class="pe-modecard-title">Practice Mode</h2>' +
      '<p class="pe-modecard-desc">Instant feedback after every question, the correct answer and explanation revealed, unlimited retries. Untimed — move at your own pace with free navigation.</p>' +
      '<ul class="pe-modecard-facts"><li>Instant feedback</li><li>Unlimited retries</li><li>Untimed</li></ul>' +
      '<span class="pe-modecard-cta">Start practicing ' + ui.ICONS.arrowRight + '</span>';
    pcard.addEventListener("click", function () { launch("practice", container); });
    modes.appendChild(pcard);

    var ecard = el("button", "pe-modecard pe-modecard-exam");
    ecard.type = "button";
    ecard.innerHTML =
      '<div class="pe-modecard-tag">EXAM</div>' +
      '<h2 class="pe-modecard-title">Exam Mode</h2>' +
      '<p class="pe-modecard-desc">A timed, exam-like sitting: randomized questions and answer order, flag-for-review, and no feedback until you submit. Pass at ' + passN + '%.</p>' +
      '<ul class="pe-modecard-facts"><li>' + examCount + ' questions</li><li>' + cfg.EXAM_TIME_LIMIT_MIN + ' minutes</li><li>' + passN + '% to pass</li></ul>' +
      '<span class="pe-modecard-cta">Start exam ' + ui.ICONS.arrowRight + '</span>';
    ecard.addEventListener("click", function () {
      launch("exam", container);
    });
    modes.appendChild(ecard);
    root.appendChild(modes);

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

  function launch(mode, container) {
    var handlers = {
      onExit: function () { showEntry(container); },
      onHome: function () { window.location.href = HOME; },
    };
    if (mode === "practice") PE.practice.start(container, handlers);
    else PE.exam.start(container, handlers);
  }

  function boot() {
    var container = document.getElementById("pe-root");
    if (!container) return;
    if (!window.STARNIX_QUESTIONS || !engine.normalizeBank().length) {
      container.innerHTML = '<div class="pe-fatal">Could not load the question bank.</div>';
      return;
    }
    showEntry(container);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  PE.app = { showEntry: showEntry };
})();
