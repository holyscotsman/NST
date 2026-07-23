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

  // A domain-breakdown row list for the results screen. (C7-03) When onPick
  // is given, rows become toggle buttons — picking one filters the review
  // list to that domain; picking it again (or another row) updates the filter.
  function domainBreakdown(byDomain, onPick) {
    var wrap = el("div", "pe-domains");
    Object.keys(byDomain).sort().forEach(function (d) {
      var s = byDomain[d];
      var pct = s.total ? Math.round((s.correct / s.total) * 100) : 0;
      var row = el(onPick ? "button" : "div", "pe-domain-row");
      if (onPick) {
        row.type = "button";
        row.setAttribute("aria-pressed", "false");
        row.title = "Show only “" + d + "” questions in the review";
        row.addEventListener("click", function () {
          var on = row.getAttribute("aria-pressed") !== "true";
          Array.prototype.forEach.call(wrap.querySelectorAll(".pe-domain-row"), function (r2) {
            r2.setAttribute("aria-pressed", "false");
            r2.classList.remove("on");
          });
          row.setAttribute("aria-pressed", String(on));
          row.classList.toggle("on", on);
          onPick(on ? d : null);
        });
      }
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

  // (C3-03) shared confirm dialog — the same contract as exam-mode's private
  // one (Escape cancels, Tab trapped, focus restored to the opener), reusing
  // the existing .pe-modal styles.
  function confirm(title, body, confirmLabel, onConfirm) {
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
    row.appendChild(cancel); row.appendChild(ok);
    modal.appendChild(row);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    ok.focus();
  }

  PE.ui = {
    el: el, esc: esc, ICONS: ICONS, LETTERS: LETTERS,
    exhibit: exhibit, option: option, domainBreakdown: domainBreakdown,
    centerPalette: centerPalette, confirm: confirm,
  };
})();
