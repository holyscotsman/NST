import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { VERSION } from '../src/core/config.js';

test('config VERSION is semver and matches package.json (single source of truth)', () => {
  assert.match(VERSION, /^\d+\.\d+\.\d+$/, 'VERSION is plain semver');
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(VERSION, pkg.version, 'config.js VERSION and package.json version move in lockstep');
  // NEGATIVE CONTROL: a placeholder/zero version must never ship.
  assert.notEqual(VERSION, '0.0.0');
});
