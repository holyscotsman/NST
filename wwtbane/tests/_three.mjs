// Import this FIRST in a test that needs three: it registers the resolver hook,
// after which `await import('../src/...')` of a module that imports 'three'
// resolves to the vendored copy.
import { register } from 'node:module';
register('./_three-hook.mjs', import.meta.url);
export const ready = true;
