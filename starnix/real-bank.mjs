/* real-bank.mjs — the question bank, from the one place it lives.
 *
 * StarNix used to carry its own compiled copy of the bank: starnix_questions.md was
 * compiled by import-questions.mjs into questions.js, and the harnesses linted that.
 * Meanwhile the app served banks/ncp-mci/ncp-mci.md through shared/bank-parser.js.
 * Two copies of the same 255 questions, and nothing compared them.
 *
 * They were identical in every stem, option and explanation right up until somebody
 * edited the bank. In v2.50.0, twenty-one exhibit descriptions were written; the
 * compiled copy kept the old ones, and every StarNix harness went on linting text no
 * player would ever see. That is the failure mode a duplicate has: not a loud
 * divergence, a quiet one, on exactly the part somebody just took the trouble to fix.
 *
 * So the compiled copy is gone and this loads the real thing the way the browser does
 * — the real markdown, the real parser, the real StarNix adapter. Which means a
 * harness using it also verifies that seam: a parser or adapter change that breaks
 * StarNix's question shape now fails here rather than in a browser.
 */
import { readFileSync } from "node:fs";

export const BANK_MD = new URL("../banks/ncp-mci/ncp-mci.md", import.meta.url);

/* The parser and loader are browser scripts: classic, window-scoped, no exports. They
 * are run in a shim carrying only what they touch — the loader reads its own <script>
 * src to find the site root, so both ways of asking for it are answered. */
export function loadRealBank() {
  const parser = readFileSync(new URL("../shared/bank-parser.js", import.meta.url), "utf8");
  const loader = readFileSync(new URL("../shared/bank-loader.js", import.meta.url), "utf8");
  const md = readFileSync(BANK_MD, "utf8");
  const shim = {
    location: { href: "https://x.test/starnix/" },
    document: {
      currentScript: { src: "https://x.test/shared/bank-loader.js" },
      getElementsByTagName: () => [{ src: "https://x.test/shared/bank-loader.js" }],
    },
  };
  new Function("window", "document", parser)(shim, shim.document);
  new Function("window", "document", loader)(shim, shim.document);

  const parsed = shim.NSTBankParser.parse(md);
  if (parsed.errors && parsed.errors.length) {
    throw new Error("the real bank no longer parses: " + (parsed.errors[0].message || parsed.errors[0]));
  }
  return shim.NSTBank.toStarNix({
    id: "ncp-mci",
    meta: parsed.meta,
    questions: parsed.questions,
    errors: [],
    count: parsed.questions.length,
  });
}
