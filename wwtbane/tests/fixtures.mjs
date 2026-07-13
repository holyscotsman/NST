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
