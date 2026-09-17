import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assess,
  runStage,
  verifyHash,
  sha256,
} from '../scripts/proof-core.mjs';
const checks = [{ id: 'a', expected: 2 }];
const result = (actual = 2) => ({
  exitCode: actual === 2 ? 0 : 1,
  stdout: JSON.stringify({
    protocol: 1,
    checks: [{ id: 'a', expected: 2, actual, pass: actual === 2 }],
  }),
});
test('verdict distinguishes assertion failure from transport failures', () => {
  assert.equal(assess(result(), checks, 'pass').verdict, 'confirmed');
  assert.equal(assess(result(1), checks, 'fail').verdict, 'confirmed');
  assert.equal(assess(result(), checks, 'fail').verdict, 'unexpected');
  for (const r of [
    { exitCode: null, stdout: '' },
    { exitCode: 137, stdout: '' },
    { exitCode: 1, stdout: 'not json' },
    { exitCode: 0, stdout: '{}' },
    { ...result(1), exitCode: 0 },
  ])
    assert.equal(assess(r, checks, 'fail').verdict, 'blocked');
});
test('missing, duplicated and falsified checks cannot pass', () => {
  const valid = JSON.parse(result().stdout);
  for (const rows of [
    [],
    [valid.checks[0], valid.checks[0]],
    [{ ...valid.checks[0], id: 'other' }],
    [{ ...valid.checks[0], actual: 0 }],
  ])
    assert.equal(
      assess(
        { exitCode: 0, stdout: JSON.stringify({ ...valid, checks: rows }) },
        checks,
        'pass',
      ).verdict,
      'blocked',
    );
});
test('artifact mismatches fail closed and still clean up', async () => {
  let cleaned = false;
  assert.doesNotThrow(() => verifyHash('a', sha256('a')));
  const r = await runStage({
    checks,
    expectation: 'pass',
    execute: async () => verifyHash('tampered', sha256('a')),
    cleanup: async () => {
      cleaned = true;
    },
  });
  assert.equal(r.verdict, 'blocked');
  assert.equal(r.reason, 'artifact_mismatch');
  assert.equal(cleaned, true);
});
test('deadline and thrown execution always clean up', async () => {
  for (const execute of [
    () => new Promise(() => {}),
    async () => {
      throw new Error('private transport detail');
    },
  ]) {
    let cleaned = false;
    const r = await runStage({
      checks,
      expectation: 'pass',
      timeoutMs: 10,
      execute,
      cleanup: async () => {
        cleaned = true;
      },
    });
    assert.equal(r.verdict, 'blocked');
    assert.equal(cleaned, true);
    assert.ok(!JSON.stringify(r).includes('private transport'));
  }
});
test('cleanup failure overrides successful assertions', async () => {
  const r = await runStage({
    checks,
    expectation: 'pass',
    execute: async () => result(),
    cleanup: async () => {
      throw new Error('failure');
    },
  });
  assert.equal(r.verdict, 'blocked');
  assert.equal(r.cleanupConfirmed, false);
  assert.equal(r.reason, 'cleanup_failed');
});
test('stalled cleanup blocks rather than hanging or reporting success', async () => {
  const r = await runStage({
    checks,
    expectation: 'pass',
    execute: async () => result(),
    cleanup: () => new Promise(() => {}),
    cleanupTimeoutMs: 10,
  });
  assert.equal(r.verdict, 'blocked');
  assert.equal(r.cleanupConfirmed, false);
});
