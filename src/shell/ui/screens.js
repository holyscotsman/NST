// screens.js — non-quiz screens: title, green room (shop + Steve), run results,
// help, and settings. Game A design: gold primaries, glass panels, warm
// gold-tinted green room, gold-takeover win / subdued loss results.

import { h, money } from './dom.js';
import { LIFELINE_TYPES, LIFELINE_META, LIFELINE_MAX_SLOTS, SHOP } from '../../core/config.js';
import { letter } from '../../core/lifelines.js';

const GOLD = '#FFC857', AQUA = '#1FDDE9', IRIS = '#7855FA';

function reduced() { return document.body.classList.contains('reduced-motion'); }

export function TitleScreen(ctx) {
  const seedInput = h('input', {
    class: 'seed-input', type: 'text', placeholder: 'NTNX-XXXXXX', 'aria-label': 'Seed code', maxLength: 16,
  });
  return h('section', { class: 'screen title-screen' },
    h('div', { class: 'brand' },
      h('p', { class: 'brand-pre' }, 'Who wants to be a'),
      h('h1', { class: 'brand-main' }, 'Nutanix Engineer?'),
      h('p', { class: 'brand-sub' }, 'A game-show quiz to learn and drill the Nutanix NCP-MCI exam. Answer 30 in a row to win.'),
    ),
    h('div', { class: 'wallet-row' },
      h('span', { class: 'wallet' }, `🪙 ${money(ctx.wallet)} coins`),
      ctx.stats.wins ? h('span', { class: 'badge' }, `🏆 ${ctx.stats.wins} win${ctx.stats.wins > 1 ? 's' : ''}`) : null,
      ctx.stats.bestPayout ? h('span', { class: 'badge' }, `Best: ${money(ctx.stats.bestPayout)}`) : null,
    ),
    h('div', { class: 'menu' },
      h('button', { class: 'primary big', type: 'button', onclick: () => ctx.onStart('mastery', null) }, 'Start new game'),
    ),
    h('details', { class: 'seed-box' },
      h('summary', {}, 'Enter seed'),
      h('p', {}, 'A seed plays the exact same 30 questions for anyone — great for challenging a friend. Leave blank for a fresh random seed. You can also share a link like ?seed=NTNX-XXXXXX (the pause menu copies it for you).'),
      h('div', { class: 'seed-controls' },
        seedInput,
        h('button', { class: 'secondary', type: 'button', onclick: () => ctx.onStart('seeded', seedInput.value.trim() || null) }, 'Play seed'),
      ),
    ),
    h('div', { class: 'title-foot' },
      h('button', { class: 'link', type: 'button', onclick: () => ctx.onHelp() }, 'How to play'),
      h('button', { class: 'link', type: 'button', onclick: () => ctx.onSettings() }, 'Settings'),
    ),
  );
}

export function GreenRoom(ctx) {
  // Straight off a loss: show the correct answer and its explanation first —
  // and the reminder that the whole point is to walk back out there.
  if (ctx.reveal) {
    const r = ctx.reveal;
    return h('section', { class: 'screen green-room' },
      h('h2', { class: 'screen-title' }, r.impossibleFinal ? '🎭 The impossible final' : 'Back in the green room'),
      h('p', { class: 'muted' }, r.impossibleFinal
        ? 'You reached the final — and almost nobody wins it the first time. That was by design. Here is the answer it was hiding:'
        : `Question ${r.reached} got you. It happens to every contestant — here is the one that did it:`),
      h('div', { class: 'reveal' },
        h('div', { class: 'reveal-label' }, 'The correct answer was'),
        h('div', { class: 'reveal-answer' }, r.correctText || '—'),
        r.explanation ? h('p', { class: 'reveal-exp' }, r.explanation) : null,
      ),
      h('div', { class: 'wallet-row' }, h('span', { class: 'wallet' }, `🛡 ${money(r.banked)} coins banked this run`)),
      h('p', { class: 'muted', style: { textAlign: 'center', maxWidth: '52ch', margin: '0 auto' } },
        'The run is over — the climb isn’t. Every question you just faced sharpened your mastery, and the ones you missed will come back until they stick. Champions are the ones who go again.'),
      h('div', { class: 'menu' },
        h('button', { class: 'primary big', type: 'button', onclick: () => ctx.onAckReveal() }, 'Got it — to the green room'),
      ),
    );
  }

  const shopRow = (type) => {
    const l = ctx.lifelines[type];
    const meta = LIFELINE_META[type];
    const canBuySlot = l.slots < LIFELINE_MAX_SLOTS;
    const slotAfford = ctx.wallet >= SHOP.lifelineSlot;
    return h('div', { class: 'shop-row' },
      h('span', { class: 'shop-ll' }, `${meta.glyph} ${meta.name}`),
      h('span', { class: `shop-slots${l.charges === 0 ? ' empty' : ''}` }, `${l.charges}/${l.slots} charged`),
      canBuySlot
        ? h('button', { class: 'secondary small', type: 'button', disabled: !slotAfford,
            onclick: () => ctx.onBuySlot(type) }, `Buy 2nd slot · ${money(SHOP.lifelineSlot)}`)
        : h('span', { class: 'maxed' }, 'Max slots'),
    );
  };

  const needsRefill = LIFELINE_TYPES.some((t) => ctx.lifelines[t].charges < ctx.lifelines[t].slots);
  const steve = ctx.steve;

  return h('section', { class: 'screen green-room' },
    h('h2', { class: 'screen-title' }, '🛋 The green room'),
    h('p', { class: 'muted' }, 'Between runs. Spend your banked coins on lifelines, or let Steve tip you off about a hard question coming up.'),
    h('div', { class: 'wallet-row' }, h('span', { class: 'wallet' }, `🪙 ${money(ctx.wallet)} coins`)),

    h('div', { class: 'green-grid' },
      h('div', { class: 'panel shop' },
        h('h3', {}, 'Lifelines'),
        ...LIFELINE_TYPES.map(shopRow),
        h('div', { class: 'shop-row refill' },
          h('span', {}, 'Recharge all lifelines to full'),
          h('button', { class: 'refill-btn', type: 'button',
            disabled: !needsRefill || ctx.wallet < SHOP.refillAll,
            onclick: () => ctx.onRefill() }, needsRefill ? `Refill · ${money(SHOP.refillAll)}` : 'All charged'),
        ),
      ),

      h('div', { class: 'panel steve' },
        h('div', { class: 'steve-head' },
          h('div', { class: 'steve-portrait', 'aria-hidden': 'true' },
            h('span', { class: 'head' }), h('span', { class: 'torso' })),
          h('div', {},
            h('h3', {}, '☎ Steve, the insider'),
            h('div', { class: 'steve-status' }, steve.question ? '● On the line' : '○ Unavailable')),
        ),
        steve.question
          ? (steve.calledThisVisit
              ? h('div', { class: 'steve-clue' },
                  h('p', { class: 'steve-said' }, `“${steve.clue}”`),
                  h('p', { class: 'steve-note' }, 'Steve will only teach this once. He always has a fresh tip next visit.'))
              : h('div', {},
                  h('p', { class: 'steve-note' }, 'Steve knows one hard question coming up and will teach you the idea behind it — for a price. One call per visit.'),
                  h('div', { style: { marginTop: '14px' } },
                    h('button', { class: 'secondary', type: 'button', disabled: ctx.wallet < SHOP.steve,
                      onclick: () => ctx.onCallSteve() }, `Call Steve · ${money(SHOP.steve)}`))))
          : h('p', { class: 'steve-note' }, 'Steve has nothing new for you right now — you have seen his tips for the questions coming up.'),
      ),
    ),

    h('div', { class: 'menu' },
      h('button', { class: 'primary big', type: 'button', onclick: () => ctx.onEnterStudio() }, 'Start next round →'),
      h('button', { class: 'link', type: 'button', onclick: () => ctx.onBack() }, 'Back to title'),
    ),
  );
}

function confettiLayer() {
  const layer = h('div', { class: 'confetti-layer', 'aria-hidden': 'true' });
  for (let i = 0; i < 16; i++) {
    const left = (i * 61) % 97, size = 5 + (i * 7) % 6, dur = 4 + (i % 5) * 0.8, delay = (i * 0.37) % 2.4;
    const col = [GOLD, GOLD, AQUA, IRIS, GOLD][i % 5];
    const s = h('span');
    Object.assign(s.style, {
      left: left + '%', width: size + 'px', height: (size * 1.6) + 'px',
      background: col, animationDuration: dur + 's', animationDelay: delay + 's',
    });
    layer.append(s);
  }
  return layer;
}

export function ResultScreen(ctx) {
  const win = ctx.won;
  return h('section', { class: `screen result-screen ${win ? 'win' : 'lose'}` },
    win ? h('div', { class: 'win-vignette', 'aria-hidden': 'true' }) : null,
    win && !reduced() ? confettiLayer() : null,
    h('div', { class: 'result-emblem-wrap' },
      win && !reduced() ? h('span', { class: 'result-ring', 'aria-hidden': 'true' }) : null,
      h('div', { class: 'result-emblem' }, win ? '🏆' : (ctx.impossibleFinal ? '🎭' : '💥'))),
    h('h2', { class: 'screen-title' }, win ? 'You are a Nutanix Engineer!' : (ctx.impossibleFinal ? 'The impossible final' : 'Run over')),

    win
      ? h('p', { class: 'result-msg' }, `You answered all 30 and took home ${money(ctx.payout)} coins. Winning banks your learning but resets coins and purchased slots — a fresh climb awaits.`)
      : h('p', { class: 'result-msg' }, ctx.impossibleFinal
          ? `You reached the final — and almost nobody wins it the first time. That was by design. Here is the answer it was hiding:`
          : `You got to question ${ctx.reached} of 30. You bank ${money(ctx.payout)} coins.`),

    (!win && ctx.correctText) ? h('div', { class: 'reveal' },
      h('div', { class: 'reveal-label' }, 'The correct answer was'),
      h('div', { class: 'reveal-answer' }, ctx.correctText),
      ctx.explanation ? h('p', { class: 'reveal-exp' }, ctx.explanation) : null,
    ) : null,

    h('div', { class: 'wallet-row' }, h('span', { class: 'wallet' }, `🪙 ${money(ctx.wallet)} coins total`)),

    h('div', { class: 'menu' },
      win
        ? h('button', { class: 'primary big', type: 'button', onclick: () => ctx.onPrestige() }, 'Climb again (prestige)')
        : h('button', { class: 'primary big', type: 'button', onclick: () => ctx.onGreenRoom() }, 'To the green room'),
      h('button', { class: 'ghost', type: 'button', onclick: () => ctx.onTitle() }, 'Back to title'),
    ),
  );
}

export function HelpScreen(onClose) {
  const rule = (t, d) => h('li', {}, h('b', {}, t + ' '), d);
  return h('section', { class: 'screen help-screen' },
    h('h2', { class: 'screen-title' }, 'How to play'),
    h('ul', { class: 'help-list' },
      rule('Answer 30 in a row.', 'Ten easy, ten medium, nine hard, then one brutal final for the top prize.'),
      rule('One wrong answer ends the run.', 'But coins bank at the safe havens (Q5, Q10, Q17 and Q25) — pass one and that money is yours to keep even if you fall later.'),
      rule('Three lifelines,', 'one use each: 50:50 removes two wrong answers, Ask the Audience polls the room (it never points you wrong, only sometimes weakly), and Phone a Friend gives a hedged tip toward the right answer. A lifeline-assisted correct answer still counts — but it will not mark that topic as mastered.'),
      rule('You learn as you play.', 'Every question tracks your personal mastery. Ones you miss come back sooner and harder; ones you nail drift away. Your learning is saved and never wiped — even by winning.'),
      rule('The green room', 'is where you spend banked coins between runs: buy a second slot for a lifeline, recharge them, or pay Steve for an inside tip on a hard question you are about to face.'),
      rule('Seeds', 'let you replay the exact same 30 questions, or challenge a friend to the same run.'),
    ),
    h('p', { class: 'muted small' }, 'Every answer key is human-authored or human-reviewed. This game never asks an AI whether your answer is right — it checks the authored key.'),
    h('button', { class: 'primary', type: 'button', onclick: onClose }, 'Got it'),
  );
}

export function SettingsScreen(ctx) {
  const toggle = (key, label, desc) => {
    const input = h('input', { type: 'checkbox', checked: !!ctx.settings[key],
      onchange: (e) => ctx.onChange(key, e.target.checked) });
    return h('label', { class: 'setting' }, input,
      h('span', {}, h('b', {}, label), h('span', { class: 'muted small' }, desc)));
  };
  const motionSel = h('select', { class: 'motion-select', onchange: (e) => ctx.onChange('motion', e.target.value) },
    ...[['auto', 'Match my system'], ['full', 'Full motion'], ['reduced', 'Reduced motion']].map(([v, t]) =>
      h('option', { value: v, selected: ctx.settings.motion === v }, t)));
  // Move progress between devices: export copies a save code, import pastes one.
  const ioBox = h('textarea', { class: 'save-io', rows: '3', placeholder: 'Paste a save code here to import…', 'aria-label': 'Save code' });
  const exportBtn = h('button', { class: 'secondary small', type: 'button' }, 'Export save code');
  exportBtn.onclick = async () => {
    const code = ctx.onExport();
    ioBox.value = code;
    try { await navigator.clipboard.writeText(code); exportBtn.textContent = 'Copied ✓'; }
    catch { ioBox.focus(); ioBox.select(); } // clipboard blocked: it's in the box, selected
  };
  const importBtn = h('button', { class: 'secondary small', type: 'button',
    onclick: () => ctx.onImport(ioBox.value) }, 'Import save code');

  return h('section', { class: 'screen settings-screen' },
    h('h2', { class: 'screen-title' }, 'Settings'),
    h('label', { class: 'setting' }, motionSel, h('span', {}, h('b', {}, 'Motion'), h('span', { class: 'muted small' }, 'Reduced motion cuts between camera angles instead of gliding, and stops flashes.'))),
    toggle('highContrast', 'High contrast', 'Boost text and outline contrast.'),
    toggle('sound', 'Sound effects', 'Short cues for picking, locking, and lifelines.'),
    toggle('music', 'Music', 'Original synth score: lounge in the green room, tier loops that slow and darken as the money climbs.'),
    toggle('extraTime', 'No timers', 'There is never a countdown; this keeps it that way if timers are ever added.'),
    h('div', { class: 'save-transfer' },
      h('b', {}, 'Move progress between devices'),
      h('span', { class: 'muted small' }, 'Export here, then import on the other device. Importing replaces this device’s progress.'),
      ioBox,
      h('div', { class: 'save-transfer-row' }, exportBtn, importBtn)),
    h('div', { class: 'danger' },
      h('button', { class: 'ghost small', type: 'button', onclick: () => ctx.onReset() }, 'Reset all progress'),
      h('span', { class: 'muted small' }, 'Wipes mastery, coins, and stats on this device.')),
    h('button', { class: 'primary', type: 'button', onclick: ctx.onClose }, 'Close'),
  );
}
