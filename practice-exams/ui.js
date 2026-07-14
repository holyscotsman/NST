/* Nutanix Practice Exams — shared UI helpers (DOM, icons, option rows, exhibits).
 * All answer/option states pair color with an icon + text so nothing relies on
 * color alone (WCAG AA), matching the NST design system. */
(function () {
  "use strict";
  var PE = (window.PE = window.PE || {});
  var engine = PE.engine;

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }
  var LETTERS = "ABCDEFGHIJKLMNOP";

  var ICONS = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>',
    flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  };

  // Renders an exhibit image block for a question, or null if none / missing.
  function exhibit(q) {
    var src = q.imageSrc || (q.image && engine.exhibitSrc(q.image));
    if (!src) return null;
    var wrap = el("figure", "pe-exhibit");
    var img = el("img");
    img.src = src;
    img.alt = q.imageAlt || ("Exhibit for question " + q.id);
    img.loading = "lazy";
    wrap.appendChild(img);
    return wrap;
  }

  /* An answer option button.
   * opts: { index, text, selected, multi, onToggle } for interactive rows.
   * feedback: { chosen:bool, correct:bool, note:string } for revealed state (disables the button). */
  function option(o, feedback) {
    var b = el("button", "pe-opt");
    b.type = "button";
    b.setAttribute("data-i", o.index);
    var role = o.multi ? "checkbox" : "radio";
    b.setAttribute("role", role);
    b.setAttribute("aria-checked", o.selected ? "true" : "false");
    if (o.selected) b.classList.add("is-selected");

    b.appendChild(el("span", "pe-opt-marker", LETTERS[o.index] || String(o.index + 1)));
    b.appendChild(el("span", "pe-opt-text", esc(o.text)));
    var state = el("span", "pe-opt-state");
    b.appendChild(state);

    if (feedback) {
      b.disabled = true;
      b.classList.remove("is-selected");
      if (feedback.correct) {
        b.classList.add("is-correct");
        state.innerHTML = ICONS.check + '<span>' + (feedback.chosen ? "Your answer · correct" : "Correct answer") + '</span>';
      } else if (feedback.chosen) {
        b.classList.add("is-incorrect");
        state.innerHTML = ICONS.x + '<span>Your answer</span>';
      }
      if (feedback.note && (feedback.correct || feedback.chosen)) {
        b.appendChild(el("span", "pe-opt-note", esc(feedback.note)));
      }
    } else if (o.onToggle) {
      b.addEventListener("click", function () { o.onToggle(o.index); });
    }
    return b;
  }

  // A domain-breakdown row list for the results screen.
  function domainBreakdown(byDomain) {
    var wrap = el("div", "pe-domains");
    Object.keys(byDomain).sort().forEach(function (d) {
      var s = byDomain[d];
      var pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
      var row = el("div", "pe-domain-row");
      row.appendChild(el("span", "pe-domain-name", esc(d)));
      var bar = el("span", "pe-domain-bar");
      var fill = el("span", "pe-domain-fill");
      fill.style.width = pct + "%";
      if (pct >= 80) fill.classList.add("ok"); else if (pct < 60) fill.classList.add("low");
      bar.appendChild(fill);
      row.appendChild(bar);
      row.appendChild(el("span", "pe-domain-pct", s.correct + "/" + s.total));
      wrap.appendChild(row);
    });
    return wrap;
  }

  // Horizontal question strip: scroll the current chip (.pe-pal.current) to center.
  function centerPalette(host) {
    if (!host) return;
    var cur = host.querySelector(".pe-pal.current");
    if (!cur) return;
    host.scrollLeft = cur.offsetLeft - host.clientWidth / 2 + cur.offsetWidth / 2;
  }

  PE.ui = {
    el: el, esc: esc, ICONS: ICONS, LETTERS: LETTERS,
    exhibit: exhibit, option: option, domainBreakdown: domainBreakdown,
    centerPalette: centerPalette,
  };
})();
