import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { SolariClient } from '@solarisdk/sdk';
import { createRequire } from 'node:module';
import { runStage, sha256, verifyHash } from './proof-core.mjs';

const require = createRequire(import.meta.url);
const { cases } = require('./retry-case/frozen-checks.cjs');
const cloud = process.argv.includes('--cloud');
const publish = process.argv.includes('--publish');
if (publish && !cloud) throw Error('Public cloud receipt requires cloud mode');
if (cloud && !process.env.SOLARI_API_KEY)
  throw Error('SOLARI_API_KEY required');
const client = cloud
  ? new SolariClient({ apiKey: process.env.SOLARI_API_KEY })
  : null;
const root = new URL('./retry-case/', import.meta.url);
const freeze = JSON.parse(await readFile(new URL('freeze.json', root), 'utf8'));
const harness = await readFile(new URL('frozen-checks.cjs', root), 'utf8');
const original = await readFile(new URL('original.cjs', root), 'utf8');
const candidate = await readFile(new URL('candidate.cjs', root), 'utf8');
verifyHash(harness, freeze.checksSha256);
verifyHash(candidate, freeze.candidateSha256);
const startedAt = new Date().toISOString();
const runId = startedAt.replaceAll(/[:.]/g, '-');
const output = path.resolve('outputs/retry', runId);
await mkdir(output, { recursive: true });
const stages = [];
const providerEvidence = [];
for (const [id, code, repro, expectation] of [
  ['original', original, true, 'fail'],
  ['candidate-repro', candidate, true, 'pass'],
  ['candidate-frozen-checks', candidate, false, 'pass'],
  ['undo', original, true, 'fail'],
]) {
  const stageStarted = Date.now();
  let sandbox, local, child;
  let hashesVerified = false;
  let provisionMs = 0,
    executionMs = 0,
    cleanupMs = 0;
  const provider = {
    stage: id,
    observedBeforeExecution: false,
    releaseAcknowledged: false,
    absentOrStoppedAfterRelease: false,
  };
  const files = { 'subject.cjs': code, 'check.cjs': harness };
  const artifacts = Object.fromEntries(
    Object.entries(files).map(([name, value]) => [name, sha256(value)]),
  );
  const checks = (repro ? cases.slice(0, 1) : cases).map(
    ([id, , expected]) => ({ id, expected }),
  );
  // Provision before the execution timer, so a late create cannot escape cleanup.
  if (client) {
    const provisionStart = Date.now();
    sandbox = await client.sandboxes.create({
      template: 'base',
      timeoutMs: 60000,
      metadata: { purpose: 'quorumpatch-retry-proof', stage: id },
    });
    provisionMs = Date.now() - provisionStart;
    provider.sandboxId = sandbox.id;
    await writeFile(
      path.join(output, 'provider-private.json'),
      JSON.stringify(
        { startedAt, providerEvidence: [...providerEvidence, provider] },
        null,
        2,
      ),
    );
  }
  const record = await runStage({
    checks,
    expectation,
    timeoutMs: 45000,
    execute: async () => {
      const provisionStart = Date.now();
      if (client) {
        const view = await client.sandboxes.get(sandbox.id);
        provider.observedBeforeExecution = view.sandboxId === sandbox.id;
        if (!provider.observedBeforeExecution) throw Error('artifact_mismatch');
        await sandbox.connect();
        const prep = await sandbox.commands.run('mkdir', {
          args: ['-p', '/workspace/proof'],
          timeoutMs: 5000,
        });
        if (prep.exitCode !== 0) throw Error('setup_failed');
        for (const [name, value] of Object.entries(files)) {
          await sandbox.files.write('/workspace/proof/' + name, value);
          const digest = await sandbox.commands.run('sha256sum', {
            args: ['/workspace/proof/' + name],
            timeoutMs: 5000,
          });
          if (
            digest.exitCode !== 0 ||
            digest.stdout.trim().split(/\s+/)[0] !== artifacts[name]
          )
            throw Error('artifact_mismatch');
        }
        hashesVerified = true;
        provisionMs += Date.now() - provisionStart;
        const executionStart = Date.now();
        const result = await sandbox.commands.run('env', {
          args: [
            '-i',
            'PATH=/usr/local/bin:/usr/bin:/bin',
            'node',
            '/workspace/proof/check.cjs',
            './subject.cjs',
            ...(repro ? ['--repro'] : []),
          ],
          timeoutMs: 15000,
        });
        executionMs = Date.now() - executionStart;
        return result;
      }
      local = await mkdtemp(path.join(tmpdir(), 'qp-retry-'));
      for (const [name, value] of Object.entries(files))
        await writeFile(path.join(local, name), value);
      provisionMs = Date.now() - provisionStart;
      const executionStart = Date.now();
      return new Promise((resolve, reject) => {
        child = spawn(
          process.execPath,
          [
            path.join(local, 'check.cjs'),
            './subject.cjs',
            ...(repro ? ['--repro'] : []),
          ],
          {
            env: { SystemRoot: process.env.SystemRoot ?? '' },
            windowsHide: true,
          },
        );
        let stdout = '';
        child.stdout.on('data', (chunk) => (stdout += chunk));
        child.on('error', reject);
        child.on('close', (exitCode) => {
          executionMs = Date.now() - executionStart;
          resolve({ exitCode, stdout });
        });
      });
    },
    cleanup: async () => {
      const cleanupStart = Date.now();
      if (child && child.exitCode === null) child.kill();
      if (sandbox) {
        await sandbox.kill();
        provider.releaseAcknowledged = true;
        try {
          const view = await client.sandboxes.get(sandbox.id);
          provider.absentOrStoppedAfterRelease = [
            'stopped',
            'killed',
            'terminated',
          ].includes(view.state);
        } catch (error) {
          if (error.status === 404) provider.absentOrStoppedAfterRelease = true;
          else throw Error('cleanup_verification_failed');
        }
        if (!provider.absentOrStoppedAfterRelease)
          throw Error('cleanup_verification_failed');
      }
      if (local) await rm(local, { recursive: true, force: true });
      cleanupMs = Date.now() - cleanupStart;
    },
  });
  stages.push({
    id,
    expectation,
    ...record,
    artifacts,
    hashesVerified,
    provisionMs,
    executionMs,
    cleanupMs,
    lifecycleMs: Date.now() - stageStarted,
    providerObserved: provider.observedBeforeExecution,
    releaseVerified: provider.absentOrStoppedAfterRelease,
  });
  providerEvidence.push(provider);
  await writeFile(
    path.join(output, 'provider-private.json'),
    JSON.stringify({ startedAt, providerEvidence }, null, 2),
  );
  console.log(`${id}: ${record.verdict} (${record.outcome ?? record.reason})`);
  if (record.verdict !== 'confirmed') break;
}
const result = {
  schemaVersion: 1,
  case: 'partial-batch-retry',
  kind: 'original-synthetic-example',
  mode: cloud ? 'solari-cloud' : 'local-process-not-security-isolated',
  startedAt,
  finishedAt: new Date().toISOString(),
  freeze,
  cost: {
    measured: false,
    reason:
      'No per-run billing receipt available; account balance rounding is not a cost measurement.',
  },
  limitations: [
    'Single worker and in-memory ledger; no concurrency or crash-durability guarantee.',
    'Frozen checks are public after evaluation; future reruns are replay, not fresh blind attempts.',
    'Provider readbacks are collected by our runner, not independent attestation.',
  ],
  stages,
  pass:
    stages.length === 4 &&
    stages.every((s) => s.verdict === 'confirmed' && s.cleanupConfirmed),
};
await writeFile(
  path.join(output, 'results.json'),
  JSON.stringify(result, null, 2) + '\n',
);
if (publish && result.pass)
  await writeFile(
    'public/retry-results.json',
    JSON.stringify(result, null, 2) + '\n',
  );
console.log('Evidence: ' + path.relative(process.cwd(), output));
if (!result.pass) process.exitCode = 1;
