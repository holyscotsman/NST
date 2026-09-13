// fixtures.mjs — synthetic, structurally valid questions for headless tests.
// Deliberately generic so tests exercise logic, not content.

function q(id, domain, diff, type, options, answer, extra = {}) {
  return {
    id, domain, authoredDifficulty: diff, type,
    stem: `Synthetic ${diff} question ${id} about ${domain}?`,
    options, answer,
    explanation: `Because ${options[answer[0]]} is the documented behavior.`,
    reviewStatus: 'verified',
    ...extra,
  };
}

const OPTS = ['Alpha', 'Bravo', 'Charlie', 'Delta'];
const PREFIX = { easy: 'E', medium: 'M', hard: 'H', extreme: 'X' };

export function makeBank({ easy = 15, medium = 15, hard = 15, extreme = 5, impossible = 2 } = {}) {
  const bank = [];
  const add = (domain, diff, n) => {
    for (let i = 1; i <= n; i++) {
      const id = `${domain.toUpperCase().slice(0, 4)}-${PREFIX[diff]}-${String(i).padStart(3, '0')}`;
      bank.push(q(id, domain, diff, 'single', OPTS.slice(), [i % 4]));
    }
  };
  add('stor', 'easy', easy);
  add('net', 'medium', medium);
  add('ahv', 'hard', hard);
  for (let i = 1; i <= extreme; i++) {
    const isImp = i <= impossible;
    bank.push(q(`PRISM-X-${String(i).padStart(3, '0')}`, 'prism', 'extreme', 'single', OPTS.slice(), [i % 4],
      { impossible: isImp, steveClue: 'The concept behind this is deep and specific.' }));
  }
  // one hard question carrying a steve clue for Steve tests
  bank.push(q('AHV-H-900', 'ahv', 'hard', 'single', OPTS.slice(), [2], { steveClue: 'Think about the scheduler.' }));
  return bank;
}

export function multiQuestion() {
  return q('STOR-M-900', 'storage', 'medium', 'multi', ['A', 'B', 'C', 'D'], [0, 2]);
}

/* (v2.52.0) A bank the REAL way: markdown in, WWTBANE questions out, through
 * shared/bank-parser.js and the toWWTBANE adapter the app actually uses.
 *
 * makeBank() above hands tests whatever shape they ask for, which is right for
 * exercising logic — and wrong for one specific question: can the shipped pipeline
 * produce this shape at all? Steve's green room only offers a hard question carrying
 * an authored `steveClue`, and selection.test.mjs proved that works by handing it
 * synthetic questions with `steveClue` set. No bank could express one, so for every
 * question the app served the answer was no, and the test could not see it.
 */
import { readFileSync } from 'node:fs';

export function adaptMarkdownBank(md) {
  const root = new URL('../../shared/', import.meta.url);
  const parser = readFileSync(new URL('bank-parser.js', root), 'utf8');
  const loader = readFileSync(new URL('bank-loader.js', root), 'utf8');
  const shim = {
    location: { href: 'https://x.test/wwtbane/' },
    document: {
      currentScript: { src: 'https://x.test/shared/bank-loader.js' },
      getElementsByTagName: () => [{ src: 'https://x.test/shared/bank-loader.js' }],
    },
  };
  new Function('window', 'document', parser)(shim, shim.document);
  new Function('window', 'document', loader)(shim, shim.document);
  const parsed = shim.NSTBankParser.parse(md);
  if (parsed.errors && parsed.errors.length) {
    throw new Error('fixture bank does not parse: ' + JSON.stringify(parsed.errors));
  }
  return {
    questions: shim.NSTBank.toWWTBANE({
      id: 'fixture', meta: parsed.meta, questions: parsed.questions,
      errors: [], count: parsed.questions.length,
    }),
    parsed,
  };
}

/* Markdown for a bank of the given shape, in the interchange format banks/ uses.
 * `clueEvery` writes an authored Steve clue onto every Nth hard question. */
export function markdownBank({ easy = 12, medium = 12, hard = 12, extreme = 4, clueOnHard = true } = {}) {
  const DIFF = { easy: 1, medium: 3, hard: 4, extreme: 5 };
  const out = ['cert: FIX', 'title: Fixture bank', 'pass: 0.80', 'domains: ahv, storage', ''];
  const add = (tier, n) => {
    for (let i = 1; i <= n; i++) {
      const id = `fx-${tier}-${i}`;
      out.push(`### ${id}`, `domain: ${i % 2 ? 'ahv' : 'storage'}`, `difficulty: ${DIFF[tier]}`, '',
        `Q: Synthetic ${tier} question ${i}?`,
        '- [x] Alpha', '- [ ] Bravo', '- [ ] Charlie', '- [ ] Delta', '',
        'Explain: Because Alpha is the documented behaviour.');
      if (tier === 'hard' && clueOnHard) {
        out.push(`Clue: Think about what the platform protects first, and why it would`,
          `rather refuse than guess. The documented threshold sits in the mid-to-high 80s.`);
      }
      out.push('');
    }
  };
  add('easy', easy); add('medium', medium); add('hard', hard); add('extreme', extreme);
  return out.join('\n');
}
