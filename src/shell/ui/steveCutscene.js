// steveCutscene.js — the split-screen "call with Shady Steve" cinematic played
// in the green room when you pay him for a tip. You're on the phone on the left,
// Steve on the right; his speech bubbles arrive one at a time:
//   1. he acknowledges you came for the good info      (flavour)
//   2-4. the concept clue for the upcoming hard question (authored q.steveClue,
//        split across three bubbles for pacing — the words are unchanged)
//   5. he signs off                                    (flavour)
// Frames 1 & 5 are generic flavour (never exam content) — flagged in FLAGS.md
// with the other AI-drafted host/insider copy. Reduced motion collapses to the
// full clue at once. The persistent clue also stays in the green-room panel
// underneath, so screen-reader users are never gated on the timed bubbles.

import { h } from './dom.js';
import { splitIntoParts } from '../../core/textSplit.js';

export const STEVE_OPENER = 'So. You came looking for that good info. Smart. I only say this once — lean in.';
export const STEVE_CLOSER = "That's the tip. You didn't get it from me — we never spoke. *click*";

const STEP_MS = 2600; // per bubble; 5 bubbles ≈ 13s

function stevePortrait() {
  return h('div', { class: 'sc-portrait steve', 'aria-hidden': 'true' },
    h('span', { class: 'sc-hat' }),
    h('span', { class: 'sc-head' },
      h('span', { class: 'sc-shades' }),
      h('span', { class: 'sc-smirk' })),
    h('span', { class: 'sc-collar' }),
    h('span', { class: 'sc-phone' }, '📞'));
}

function youPortrait() {
  return h('div', { class: 'sc-portrait you', 'aria-hidden': 'true' },
    h('span', { class: 'sc-head' },
      h('span', { class: 'sc-eye l' }), h('span', { class: 'sc-eye r' }),
      h('span', { class: 'sc-mouth' })),
    h('span', { class: 'sc-collar' }),
    h('span', { class: 'sc-phone' }, '📞'));
}

// Plays the cutscene into `root`. Returns a skip() that finishes it early.
export function playSteveCutscene(root, { clue, reduced = false, onDone } = {}) {
  // Selection guarantees a clue exists (peekUpcomingHard only sells clue-carrying
  // questions), but if one ever arrives empty, skip the three clue bubbles rather
  // than popping blanks between the opener and the sign-off.
  const parts = (clue && clue.trim()) ? splitIntoParts(clue, 3) : [];
  const lines = [STEVE_OPENER, ...parts, STEVE_CLOSER];

  const bubble = h('p', { class: 'sc-bubble', 'aria-live': 'polite' }, '');
  const steveSide = h('div', { class: 'sc-side steve' }, stevePortrait(), h('span', { class: 'sc-name' }, 'Steve'), bubble);
  const youSide = h('div', { class: 'sc-side you' }, youPortrait(), h('span', { class: 'sc-name' }, 'You'));
  const skipBtn = h('button', { class: 'sc-skip', type: 'button' }, 'Skip ▸');
  const layer = h('div', { class: 'steve-cine', role: 'dialog', 'aria-label': 'A call with Steve, the insider' },
    h('div', { class: 'sc-split' }, youSide, steveSide),
    skipBtn);
  root.append(layer);

  let done = false;
  const timers = [];
  const finish = () => {
    if (done) return; done = true;
    timers.forEach(clearTimeout);
    layer.remove();
    if (onDone) onDone();
  };
  skipBtn.addEventListener('click', finish);

  if (reduced) {
    // No timed sequence under reduced motion — show the whole clue at once.
    bubble.textContent = parts.join(' ');
    youSide.classList.remove('talking'); steveSide.classList.add('talking');
    timers.push(setTimeout(finish, 1200));
    return finish;
  }

  lines.forEach((line, k) => timers.push(setTimeout(() => {
    bubble.classList.remove('pop'); void bubble.offsetWidth; bubble.classList.add('pop');
    bubble.textContent = line;
    steveSide.classList.add('talking'); youSide.classList.remove('talking');
  }, k * STEP_MS)));
  // a beat after the last line, then hand back to the green room
  timers.push(setTimeout(finish, lines.length * STEP_MS + 500));
  return finish;
}
