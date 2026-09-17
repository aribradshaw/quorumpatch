import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cases } from '../scripts/open-source-cases.mjs';
import { assess } from '../scripts/proof-core.mjs';
test('published cloud results are complete, consistent and tied to pinned cases', () => {
  const data = JSON.parse(
    readFileSync('public/open-source-results.json', 'utf8'),
  );
  assert.equal(data.mode, 'solari-cloud');
  assert.equal(data.pass, true);
  assert.equal(data.cases.length, 3);
  assert.equal(data.independentAttestation, false);
  assert.equal(data.upstreamSubmitted, false);
  for (const c of data.cases) {
    const spec = cases.find((s) => s.id === c.id);
    assert.ok(spec);
    assert.equal(c.commit, spec.commit);
    assert.equal(c.sha256, spec.sha256);
    assert.deepEqual(
      c.stages.map((s) => s.id),
      [
        'original',
        'bad-repro',
        'bad-checks',
        'patch-repro',
        'patch-checks',
        'undo',
      ],
    );
    assert.equal(c.stages[0].sourceSha256, c.sha256);
    assert.equal(c.stages[5].sourceSha256, c.sha256);
    assert.equal(c.stages[1].sourceSha256, c.stages[2].sourceSha256);
    assert.equal(c.stages[3].sourceSha256, c.stages[4].sourceSha256);
    assert.equal(c.stages[3].sourceSha256, c.candidateSha256);
    for (const stage of c.stages) {
      assert.equal(stage.verdict, 'confirmed');
      assert.equal(stage.cleanupConfirmed, true);
      assert.equal(stage.remoteHashesVerified, true);
      const checks = stage.id.endsWith('checks') ? spec.checks : spec.repro;
      const assessed = assess(
        {
          exitCode: stage.outcome === 'fail' ? 1 : 0,
          stdout: JSON.stringify({ protocol: 1, checks: stage.checks }),
        },
        checks,
        stage.expectation,
      );
      assert.equal(assessed.verdict, 'confirmed');
    }
  }
});
