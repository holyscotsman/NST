// Release-consistency guard: shared/nst-version.js and the CHANGELOG's top
// entry must move together (a cycle once shipped exactly this drift — the
// code landed without the bump). Run from anywhere: paths resolve from here.
import { readFileSync } from "node:fs";

const src = readFileSync(new URL("../shared/nst-version.js", import.meta.url), "utf8");
const log = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");

const mV = src.match(/NST_VERSION = "(\d+\.\d+\.\d+)"/);
const mC = log.match(/^## v(\d+\.\d+\.\d+)/m);

if (!mV) { console.error("version-check: could not read NST_VERSION from shared/nst-version.js"); process.exit(1); }
if (!mC) { console.error('version-check: no "## vX.Y.Z" entry found in CHANGELOG.md'); process.exit(1); }
if (mV[1] !== mC[1]) {
  console.error(`version-check: shared/nst-version.js says ${mV[1]} but CHANGELOG.md's top entry is v${mC[1]}`);
  process.exit(1);
}
console.log(`version-check: v${mV[1]} consistent (shared/nst-version.js == CHANGELOG top entry)`);
