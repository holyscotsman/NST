import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseMarkdownBank } from '../src/content/parseMarkdownBank.js';

const Q = (body) => `## Q\n- **Domain:** storage\n- **Difficulty:** easy\n\n**Question:** ${body}`;

test('the example bank parses, validates, and infers single vs multi', () => {
  const md = readFileSync(new URL('../docs/question-bank.example.md', import.meta.url), 'utf8');
  const { questions, rejected } = parseMarkdownBank(md);
  assert.equal(rejected.length, 0, JSON.stringify(rejected));
  assert.equal(questions.length, 3);
  assert.equal(questions[0].type, 'single');           // one [x]
  assert.equal(questions[1].type, 'multi');            // several [x]
  assert.deepEqual(questions[1].answer, [0, 1, 3]);    // marks map to indices
  assert.ok(questions[2].image.src.endsWith('example-diagram.png'));
  assert.ok(questions[2].image.alt.length > 0);
});

test('ids auto-generate per domain + difficulty', () => {
  const md = `${Q('A stem long enough to pass validation here?')}\n- [x] Right answer\n- [ ] Wrong one\n- [ ] Another wrong\n- [ ] Last wrong\n\n**Explanation:** Because it is the right one.`;
  const { questions } = parseMarkdownBank(md);
  assert.equal(questions[0].id, 'STOR-E-001');
  assert.equal(questions[0].reviewStatus, 'human-reviewed'); // owner content
});

test('a bare image filename resolves into the images dir', () => {
  const md = `## Q\n- **Domain:** ahv\n- **Difficulty:** easy\n- **Image:** foo.png\n- **Alt:** A picture of foo\n\n**Question:** Which stem is long enough to validate here?\n- [x] Correct\n- [ ] Nope\n- [ ] Nah\n- [ ] No\n\n**Explanation:** Correct is correct here.`;
  const { questions } = parseMarkdownBank(md);
  assert.equal(questions[0].image.src, 'src/content/images/foo.png');
});

// ---- negative controls ----
test('negative control: no [x] marked → rejected (no key)', () => {
  const md = `${Q('Which option is right in this stem here?')}\n- [ ] A\n- [ ] B\n- [ ] C\n- [ ] D\n\n**Explanation:** None marked, so no key.`;
  const { questions, rejected } = parseMarkdownBank(md);
  assert.equal(questions.length, 0);
  assert.equal(rejected.length, 1);
});

test('negative control: an image without Alt is rejected', () => {
  const md = `## Q\n- **Domain:** ahv\n- **Difficulty:** easy\n- **Image:** foo.png\n\n**Question:** A stem that is definitely long enough here?\n- [x] Yes\n- [ ] No\n- [ ] Maybe\n- [ ] Never\n\n**Explanation:** Yes is the one.`;
  const { rejected } = parseMarkdownBank(md);
  assert.equal(rejected.length, 1);
  assert.ok(rejected[0].errors.join(' ').toLowerCase().includes('alt') || rejected[0].errors.join(' ').toLowerCase().includes('description'));
});

test('negative control: fewer than 4 options is rejected', () => {
  const md = `${Q('A stem that is plenty long for the check?')}\n- [x] Only\n- [ ] Two\n\n**Explanation:** Too few options here.`;
  const { rejected } = parseMarkdownBank(md);
  assert.equal(rejected.length, 1);
});

test('negative control: empty input reports an error, not a crash', () => {
  assert.equal(parseMarkdownBank('').rejected.length, 1);
  assert.equal(parseMarkdownBank('no headings here at all').rejected.length, 1);
});

test('summary flags whether the bank can fill a full run', () => {
  const { summary } = parseMarkdownBank(readFileSync(new URL('../docs/question-bank.example.md', import.meta.url), 'utf8'));
  assert.equal(summary.meetsRunRequirement, false); // only 3 questions
  assert.equal(summary.total, 3);
  assert.equal(summary.images, 1);
});

// ---- alias normalization, field extraction, conflicts ----
const opts4 = '- [x] Right\n- [ ] Wrong one\n- [ ] Another wrong\n- [ ] Last wrong';
const withExpl = '\n\n**Explanation:** Because it is the right one here.';

test('informal domain and difficulty aliases normalize', () => {
  const md = `## Q\n- **Domain:** AOS\n- **Difficulty:** med\n\n**Question:** A stem long enough to validate here?\n${opts4}${withExpl}`;
  const { questions, rejected } = parseMarkdownBank(md);
  assert.equal(rejected.length, 0, JSON.stringify(rejected));
  assert.equal(questions[0].domain, 'storage');       // AOS -> storage
  assert.equal(questions[0].authoredDifficulty, 'medium'); // med -> medium
});

test('lifeline / tags / impossible fields land on the object with the right types', () => {
  const md = `## Q\n- **Domain:** dataprotection\n- **Difficulty:** extreme\n- **Impossible:** true\n\n**Question:** A suitably long final stem for validation here?\n${opts4}${withExpl}\n**Phone a friend:** I think it's the first one.\n**Steve:** Recall how RF works, then decide.\n**Tags:** rf, replication`;
  const { questions, rejected } = parseMarkdownBank(md);
  assert.equal(rejected.length, 0, JSON.stringify(rejected));
  const q = questions[0];
  assert.equal(q.impossible, true);
  assert.equal(q.phoneHint, "I think it's the first one.");
  assert.equal(q.steveClue, 'Recall how RF works, then decide.');
  assert.deepEqual(q.tags, ['rf', 'replication']);
});

test('a Priority field marks the question, and its absence leaves it unset', () => {
  const md = `## Q\n- **Domain:** storage\n- **Difficulty:** medium\n- **Priority:** yes\n\n**Question:** A stem long enough to validate here?\n${opts4}${withExpl}`;
  const { questions } = parseMarkdownBank(md);
  assert.equal(questions[0].priority, true);
  // NEGATIVE CONTROL: no Priority field -> the flag is absent (not false-y noise).
  const plain = `## Q\n- **Domain:** storage\n- **Difficulty:** medium\n\n**Question:** A stem long enough to validate here?\n${opts4}${withExpl}`;
  assert.equal('priority' in parseMarkdownBank(plain).questions[0], false);
});

test('multi-line stem and explanation fold with single spaces', () => {
  const md = `## Q\n- **Domain:** ahv\n- **Difficulty:** easy\n\n**Question:** This stem\nspans two lines.\n${opts4}\n\n**Explanation:** This reason\nalso spans lines.`;
  const { questions } = parseMarkdownBank(md);
  assert.equal(questions[0].stem, 'This stem spans two lines.');
  assert.equal(questions[0].explanation, 'This reason also spans lines.');
});

test('negative control: **Type:** single with two [x] marks is rejected', () => {
  const md = `## Q\n- **Domain:** ahv\n- **Difficulty:** easy\n- **Type:** single\n\n**Question:** A stem that is plenty long for the check here?\n- [x] One\n- [x] Two\n- [ ] Three\n- [ ] Four${withExpl}`;
  const { rejected } = parseMarkdownBank(md);
  assert.equal(rejected.length, 1); // single-answer must have exactly one key
});

test('negative control: duplicate explicit IDs are rejected across the bank', () => {
  const one = `## Q1\n- **Domain:** ahv\n- **Difficulty:** easy\n- **ID:** DUP-E-001\n\n**Question:** First stem long enough to validate here?\n${opts4}${withExpl}`;
  const two = `## Q2\n- **Domain:** ahv\n- **Difficulty:** easy\n- **ID:** DUP-E-001\n\n**Question:** Second stem long enough to validate here?\n${opts4}${withExpl}`;
  const { questions, rejected } = parseMarkdownBank(one + '\n\n' + two);
  assert.equal(questions.length, 1);
  assert.equal(rejected.length, 1);
  assert.ok(rejected[0].errors.join(' ').toLowerCase().includes('duplicate'));
});
