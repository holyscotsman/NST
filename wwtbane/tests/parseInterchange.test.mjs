import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseInterchangeBank, looksLikeInterchange } from '../src/content/parseInterchangeBank.js';

const BLOCK = `### ncp-mci-e9-q1

A stem long enough to validate for the interchange test?

- ( ) Alpha
  > Wrong because of Alpha reasons.
- (x) Bravo
  > Correct because of Bravo reasons.
- ( ) Charlie
  > Wrong because of Charlie reasons.
- ( ) Delta

@overall: Bravo is the documented behavior for this scenario.
@domain: vms
@difficulty: 2
@tags: alpha, bravo
@briefing: StarNix commander voice that WWTBANE must drop.
`;

test('the shipped interchange bank (e1) parses: 51 valid, 0 rejected, keys match the (x) marks', () => {
  const raw = readFileSync(new URL('../docs/interchange/e1.md', import.meta.url), 'utf8');
  const { questions, rejected, summary } = parseInterchangeBank(raw);
  assert.equal(rejected.length, 0, JSON.stringify(rejected));
  assert.equal(questions.length, 51);
  assert.equal(summary.images, 6);
  // Independent key extraction straight off the raw (x) marks.
  const truth = {};
  let id = null, oi = -1;
  for (const line of raw.split('\n')) {
    const h = line.match(/^### (\S+)/);
    if (h) { id = h[1]; oi = -1; truth[id] = []; continue; }
    const o = line.match(/^- \((x| )\)/);
    if (o && id) { oi += 1; if (o[1] === 'x') truth[id].push(oi); }
  }
  for (const q of questions) assert.deepEqual(q.answer, truth[q.id], `key of ${q.id}`);
});

test('a block converts with domain/difficulty mapping, notes, and no briefing', () => {
  const { questions, rejected } = parseInterchangeBank(BLOCK);
  assert.equal(rejected.length, 0, JSON.stringify(rejected));
  const q = questions[0];
  assert.equal(q.id, 'ncp-mci-e9-q1');       // interchange id kept verbatim
  assert.equal(q.domain, 'ahv');             // vms -> ahv
  assert.equal(q.authoredDifficulty, 'medium'); // 2 -> medium
  assert.deepEqual(q.answer, [1]);
  assert.equal(q.type, 'single');
  assert.equal(q.reviewStatus, 'human-reviewed');
  assert.deepEqual(q.tags, ['alpha', 'bravo']);
  assert.deepEqual(q.optionNotes, [
    'Wrong because of Alpha reasons.',
    'Correct because of Bravo reasons.',
    'Wrong because of Charlie reasons.',
    '', // Delta had no note — alignment preserved
  ]);
  assert.equal('briefing' in q, false, 'StarNix briefing is dropped'); // NEGATIVE CONTROL
  assert.equal('priority' in q, false, 'no @priority -> no flag');    // NEGATIVE CONTROL
});

test('exhibits map into src/content/images/ and demand alt text', () => {
  const withImage = BLOCK.replace('@overall:', '@image: pic.png\n@image-alt: A diagram of the thing\n@overall:');
  const { questions } = parseInterchangeBank(withImage);
  assert.deepEqual(questions[0].image, { src: 'src/content/images/pic.png', alt: 'A diagram of the thing' });

  const noAlt = BLOCK.replace('@overall:', '@image: pic.png\n@overall:');
  const res = parseInterchangeBank(noAlt);
  assert.equal(res.questions.length, 0); // NEGATIVE CONTROL: exhibit without alt is rejected
  assert.match(res.rejected[0].errors.join(' '), /image-alt|alt/i);
});

test('negative control: quarantined review blocks (@review/@multi) are rejected', () => {
  const review = readFileSync(new URL('../docs/interchange/e1-review.md', import.meta.url), 'utf8');
  const { questions, rejected } = parseInterchangeBank(review);
  assert.equal(questions.length, 0, 'review-file questions must never import');
  assert.equal(rejected.length, 9);
  assert.ok(rejected.every((r) => r.errors.some((e) => e.includes('quarantined'))));
});

test('negative control: a block with no (x) mark has no key and is rejected', () => {
  const noKey = BLOCK.replace('- (x) Bravo', '- ( ) Bravo');
  const { questions, rejected } = parseInterchangeBank(noKey);
  assert.equal(questions.length, 0);
  assert.equal(rejected.length, 1);
});

test('negative control: unknown domain / difficulty are rejected, not guessed silently', () => {
  const badDomain = BLOCK.replace('@domain: vms', '@domain: quantum');
  assert.equal(parseInterchangeBank(badDomain).rejected.length, 1);
  const badDiff = BLOCK.replace('@difficulty: 2', '@difficulty: 9');
  assert.equal(parseInterchangeBank(badDiff).rejected.length, 1);
});

test('@priority: 1 maps to the priority flag', () => {
  const prio = BLOCK.replace('@difficulty: 2', '@difficulty: 2\n@priority: 1');
  const { questions } = parseInterchangeBank(prio);
  assert.equal(questions[0].priority, true);
});

test('format detection tells interchange from the native authoring format', () => {
  assert.equal(looksLikeInterchange(BLOCK), true);
  const native = '## Q1\n- **Domain:** storage\n\n**Question:** A stem?\n- [x] A\n- [ ] B\n- [ ] C\n- [ ] D\n';
  assert.equal(looksLikeInterchange(native), false); // NEGATIVE CONTROL
});
