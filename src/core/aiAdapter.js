// aiAdapter.js — deliberate NO-OP seam.
//
// Learning integrity (CLAUDE.md §4/§7): an LLM must NEVER determine correctness
// at runtime. The authored answer key is authoritative. This module exists only
// as a stable seam so future OFFLINE ingestion QA (flagging ambiguous keys,
// drafting explanations) has a place to plug in — always behind mandatory human
// review, and never in the answer path.
//
// Every method here is inert. Wiring real behavior into the runtime answer flow
// is explicitly forbidden.

export const AIAdapter = {
  enabled: false,

  // Runtime grading must never call an LLM. This always defers to the key.
  gradeAnswer() {
    throw new Error('AIAdapter.gradeAnswer is forbidden: the authored key decides correctness.');
  },

  // Offline-only hooks (no-ops until a reviewed pipeline is built).
  async flagAmbiguousKeys(/* bank */) { return []; },
  async draftExplanation(/* question */) { return null; },
};

export default AIAdapter;
