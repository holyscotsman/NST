// textSplit.js — pure text helper. Splits a passage into `n` roughly-equal
// consecutive parts, preferring sentence boundaries and falling back to words
// when there aren't enough sentences. Used to pace an authored clue across
// several speech bubbles without rewriting the content (the words are unchanged;
// only where they break). No browser/Node APIs.

export function splitIntoParts(text, n) {
  const s = String(text || '').replace(/\s+/g, ' ').trim();
  if (n <= 1) return [s];
  if (!s) return Array(n).fill('');
  const sentences = (s.match(/[^.!?]+[.!?]*/g) || [s]).map((x) => x.trim()).filter(Boolean);
  // Enough sentences → group them; otherwise fall back to word-level splitting.
  const bySentence = sentences.length >= n;
  const units = bySentence ? sentences : s.split(' ');
  const per = units.length / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    const start = Math.round(i * per);
    const end = Math.round((i + 1) * per);
    out.push(units.slice(start, end).join(' ').trim());
  }
  // Extremely short text can leave a bucket empty; never emit a blank bubble.
  return out.map((p) => p || '…');
}
