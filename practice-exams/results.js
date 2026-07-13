/* Nutanix Practice Exams — shared results + per-question review screen.
 * Used by Exam Mode (after submit) and available as an end summary. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var ui = PE.ui, engine = PE.engine, el = null, esc = null;

  function correctSet(q) { return Array.isArray(q.correct) ? q.correct : [q.correct]; }

  // summary: from engine.summarize(). opts: { title, timedOut, onRetake, onHome }
  function render(container, summary, opts) {
    el = ui.el; esc = ui.esc; opts = opts || {};
    container.innerHTML = "";
    var root = el("div", "pe-results");

    var passN = Math.round(window.PE_CONFIG.PASS_THRESHOLD * 100);
    var outcome = el("div", "pe-outcome " + (summary.pass ? "pass" : "fail"));
    outcome.appendChild(el("div", "pe-outcome-badge", summary.pass ? ui.ICONS.check : ui.ICONS.x));
    var head = el("div", "pe-outcome-head");
    head.appendChild(el("div", "pe-outcome-word", summary.pass ? "Pass" : "Fail"));
    head.appendChild(el("div", "pe-outcome-sub",
      (summary.pass ? "You met the " : "You did not meet the ") + passN + "% pass bar."
      + (opts.timedOut ? " Time expired — the exam was auto-submitted." : "")));
    outcome.appendChild(head);
    root.appendChild(outcome);

    // Score dial
    var score = el("div", "pe-score");
    score.appendChild(el("div", "pe-score-pct", summary.pct + "%"));
    score.appendChild(el("div", "pe-score-frac", summary.correct + " of " + summary.total + " correct"));
    root.appendChild(score);

    // Domain breakdown
    if (Object.keys(summary.byDomain).length) {
      root.appendChild(el("h3", "pe-h3", "By domain"));
      root.appendChild(ui.domainBreakdown(summary.byDomain));
    }

    // Actions
    var actions = el("div", "pe-results-actions");
    var retake = el("button", "pe-btn pe-btn-primary", "Retake");
    retake.type = "button";
    retake.addEventListener("click", function () { opts.onRetake && opts.onRetake(); });
    actions.appendChild(retake);
    var home = el("button", "pe-btn pe-btn-ghost", "Back to home");
    home.type = "button";
    home.addEventListener("click", function () { opts.onHome && opts.onHome(); });
    actions.appendChild(home);
    root.appendChild(actions);

    // Per-question review
    root.appendChild(el("h3", "pe-h3", "Review — every question"));
    var list = el("div", "pe-review");
    summary.results.forEach(function (r, i) {
      list.appendChild(reviewItem(r, i));
    });
    root.appendChild(list);

    container.appendChild(root);
    container.scrollTop = 0;
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  function reviewItem(r, i) {
    var q = r.q;
    var cset = correctSet(q);
    var chosen = Array.isArray(r.chosen) ? r.chosen : (r.chosen == null ? [] : [r.chosen]);
    var item = el("div", "pe-review-item " + (r.correct ? "ok" : "bad"));

    var top = el("div", "pe-review-top");
    top.appendChild(el("span", "pe-review-num", "Q" + (i + 1)));
    var tag = el("span", "pe-review-tag " + (r.correct ? "ok" : "bad"));
    tag.innerHTML = (r.correct ? ui.ICONS.check + "<span>Correct</span>"
      : ui.ICONS.x + "<span>" + (chosen.length ? "Incorrect" : "Not answered") + "</span>");
    top.appendChild(tag);
    if (q.domain) top.appendChild(el("span", "pe-review-domain", esc(q.domain)));
    item.appendChild(top);

    item.appendChild(el("p", "pe-review-prompt", esc(q.prompt)));
    var ex = ui.exhibit(q);
    if (ex) item.appendChild(ex);

    var opts = el("div", "pe-review-opts");
    q.options.forEach(function (text, idx) {
      opts.appendChild(ui.option(
        { index: idx, text: text, multi: Array.isArray(q.correct) },
        { chosen: chosen.indexOf(idx) >= 0, correct: cset.indexOf(idx) >= 0, note: q.optionNotes ? q.optionNotes[idx] : "" }
      ));
    });
    item.appendChild(opts);

    if (q.explanation) {
      var exp = el("div", "pe-explain");
      exp.appendChild(el("span", "pe-explain-label", "Explanation"));
      exp.appendChild(el("p", null, esc(q.explanation)));
      item.appendChild(exp);
    }
    return item;
  }

  PE.results = { render: render };
})();
