import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotComplete } from '../scripts/snapshot-evidence.mjs';
import { readFile } from 'node:fs/promises';
import { sha256 } from '../scripts/proof-core.mjs';
function receipt() {
  const assessment = (outcome) => ({
    verdict: 'confirmed',
    outcome,
    checks: [
      { id: 'partial-retry', pass: true },
      { id: 'unknown-is-not-retried', pass: false },
    ],
  });
  const browser = (name, order) => ({
    name,
    pass: true,
    observedSendOrder: order,
    expectedSendOrder: order,
    browserAssertionsPassed: true,
  });
  return {
    stages: [
      { name: 'prepare', pass: true },
      { name: 'snapshot', pass: true, providerReadback: true },
      { name: 'original-fork', pass: true, assessment: assessment('fail') },
      browser('browser-original', 'A → B → A → B'),
      { name: 'contaminate-first-fork', pass: true },
      { name: 'incomplete-fork', pass: true, assessment: assessment('fail') },
      {
        name: 'fresh-fork-separation',
        pass: true,
        marker: false,
        providerKeyPresent: false,
      },
      { name: 'candidate', pass: true, assessment: assessment('pass') },
      browser('browser-candidate', 'A → B → B'),
      {
        name: 'rewind',
        pass: true,
        contaminationRemoved: true,
        assessment: assessment('fail'),
      },
      browser('browser-rewind', 'A → B → A → B'),
    ],
    cleanup: [
      ...Array.from({ length: 4 }, () => ({
        resource: 'sandbox',
        confirmed: true,
      })),
      { resource: 'snapshot', confirmed: true },
    ],
    browserReleased: true,
    browserRecording: { downloaded: true, bytes: 100 },
  };
}
test('snapshot evidence requires the full ordered experiment', () => {
  assert.equal(snapshotComplete(receipt(), true), true);
  for (let i = 0; i < 11; i++) {
    const value = receipt();
    value.stages.splice(i, 1);
    assert.equal(snapshotComplete(value, true), false);
  }
});
test('cleanup, replay, separation and rewind failures cannot pass', () => {
  for (const mutate of [
    (r) => (r.cleanup[0].confirmed = false),
    (r) => (r.browserReleased = false),
    (r) => (r.browserRecording.downloaded = false),
    (r) => (r.browserRecording.bytes = 0),
    (r) => (r.stages[6].marker = true),
    (r) => (r.stages[6].providerKeyPresent = true),
    (r) => (r.stages[9].contaminationRemoved = false),
    (r) => (r.stages[8].observedSendOrder = 'A → B → A → B'),
    (r) => (r.stages[5].assessment.checks[1].pass = true),
    (r) => (r.error = { name: 'TimeoutError' }),
  ]) {
    const value = receipt();
    mutate(value);
    assert.equal(snapshotComplete(value, true), false);
  }
});
test('public snapshot receipt matches its sanitized replay and full experiment', async () => {
  const text = await readFile(
    new URL('../public/snapshot-results.json', import.meta.url),
    'utf8',
  );
  const replay = await readFile(
    new URL('../public/snapshot-replay.json', import.meta.url),
    'utf8',
  );
  const result = JSON.parse(text);
  assert.equal(snapshotComplete(result, true), true);
  assert.equal(sha256(replay), result.browserRecording.publicSha256);
  assert.equal(JSON.parse(replay).length, result.browserRecording.publicEvents);
  assert.equal(
    /slr_live_|pt_token|x-pinetree-preview-token|sandboxId|sessionId|Bearer\s|https?:\/\//i.test(
      text + replay,
    ),
    false,
  );
});
