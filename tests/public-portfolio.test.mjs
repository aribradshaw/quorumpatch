import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
test('six summaries preserve privacy and limitations', () => {
  const data = JSON.parse(fs.readFileSync('public/pilot-proof.json', 'utf8'));
  assert.equal(data.cases.length, 6);
  assert.equal(data.independentAttestation, false);
  assert.equal(data.autonomousRepairGeneration, false);
  for (const c of data.cases) {
    assert.equal(c.cleanupConfirmed, true);
    assert.ok(c.boundary && c.next);
    assert.equal(c.receiptSha256, undefined);
    assert.equal(c.recordedAt, undefined);
  }
});
test('synthetic four-stage demonstration succeeds', () => {
  const result = spawnSync(process.execPath, ['scripts/synthetic-proof.mjs'], { encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr);
  const receipt = JSON.parse(fs.readFileSync('outputs/synthetic-proof.json', 'utf8'));
  assert.equal(receipt.pass, true);
  assert.equal(receipt.roles.length, 4);
  assert.equal(receipt.roles[1].artifactSha256, receipt.roles[2].artifactSha256);
  assert.notEqual(receipt.roles[1].artifactSha256, receipt.roles[3].artifactSha256);
});
