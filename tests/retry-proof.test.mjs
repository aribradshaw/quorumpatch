import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { sha256 } from '../scripts/proof-core.mjs';
const require = createRequire(import.meta.url);
const { cases } = require('../scripts/retry-case/frozen-checks.cjs');
const original = require('../scripts/retry-case/original.cjs');
const candidate = require('../scripts/retry-case/candidate.cjs');
test('frozen checks and first candidate have not changed since evaluation', async () => {
  const root = new URL('../scripts/retry-case/', import.meta.url);
  const freeze = JSON.parse(
    await readFile(new URL('freeze.json', root), 'utf8'),
  );
  assert.equal(
    sha256(await readFile(new URL('frozen-checks.cjs', root))),
    freeze.checksSha256,
  );
  assert.equal(
    sha256(await readFile(new URL('candidate.cjs', root))),
    freeze.candidateSha256,
  );
  assert.equal(freeze.attempts, 1);
});
test('original duplicate-send failure is real and first repair preserves receipts', async () => {
  const [, run, expected] = cases[0];
  assert.notDeepEqual(await run(original.deliver), expected);
  assert.deepEqual(await run(candidate.deliver), expected);
});
test('first candidate passes every unchanged frozen contract check', async () => {
  for (const [id, run, expected] of cases)
    assert.deepEqual(await run(candidate.deliver), expected, id);
});
test('reproducer-only green does not establish uncertain-retry safety', async () => {
  // Deliberately incomplete control, NOT the separate agent's candidate.
  const { deliver: naive } = require('../scripts/retry-case/incomplete.cjs');
  assert.deepEqual(await cases[0][1](naive), cases[0][2]);
  assert.notDeepEqual(await cases[1][1](naive), cases[1][2]);
});
test('saved cloud receipt requires four provider-observed released stages', async () => {
  const receipt = JSON.parse(
    await readFile(
      new URL('../public/retry-results.json', import.meta.url),
      'utf8',
    ),
  );
  assert.equal(receipt.pass, true);
  assert.equal(receipt.stages.length, 4);
  for (const stage of receipt.stages) {
    assert.equal(stage.providerObserved, true);
    assert.equal(stage.releaseVerified, true);
    assert.equal(stage.hashesVerified, true);
    assert.equal(stage.cleanupConfirmed, true);
  }
  assert.equal(receipt.cost.measured, false);
  assert.equal(receipt.freeze.independentAttestation, false);
  assert.equal(JSON.stringify(receipt).includes('sandboxId'), false);
});
