import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { SolariClient } from '@solarisdk/sdk';

const cloud = process.argv.includes('--cloud');
if (cloud && !process.env.SOLARI_API_KEY) throw new Error('SOLARI_API_KEY is required for cloud mode');
const hash = value => createHash('sha256').update(value).digest('hex');
// Original synthetic code owned by this project, unrelated to any private source.
const base = 'export const amountDue = (unit, quantity) => unit;';
const candidate = 'export const amountDue = (unit, quantity) => unit * quantity;';
const mutant = candidate.replace('unit * quantity', 'unit * 1');
const harness = checks => `import { amountDue } from './subject.mjs';
const cases = ${JSON.stringify(checks)}; const failures = [];
for (const [unit, quantity, expected] of cases) if (amountDue(unit, quantity) !== expected) failures.push({code:'quantity_ignored'});
console.log(JSON.stringify({total:cases.length,passed:cases.length-failures.length,failures}));
if(failures.length) process.exitCode=1;`;
const repro = [[125, 3, 375]];
const heldout = [[99, 2, 198], [0, 8, 0], [5, 0, 0], [7, 1, 7]];
const client = cloud ? new SolariClient({ apiKey: process.env.SOLARI_API_KEY }) : null;
const records = [];
const plan = [['reproducer',base,repro,1],['builder-replay',candidate,repro,0],['held-out-verifier',candidate,heldout,0],['counterfactual',mutant,repro,1]];
for (const [role, source, cases, expectedExit] of plan) {
  const files = { 'subject.mjs': source, 'check.mjs': harness(cases) };
  let sandbox; let local; let result;
  const record = { role, artifactSha256: hash(source), isolated: false, remoteHashesVerified: false, cleanupConfirmed: false, pass: false };
  try {
    if (client) {
      sandbox = await client.sandboxes.create({ template: 'base', timeoutMs: 120000 });
      await sandbox.connect();
      const prep = await sandbox.commands.run('mkdir', { args: ['-p', '/workspace/proof'], timeoutMs: 10000 });
      if (prep.exitCode !== 0) throw new Error('Sandbox setup failed');
      for (const [name, text] of Object.entries(files)) {
        await sandbox.files.write('/workspace/proof/' + name, text);
        const digest = await sandbox.commands.run('sha256sum', { args: ['/workspace/proof/' + name], timeoutMs: 10000 });
        if (digest.exitCode !== 0 || digest.stdout.trim().split(/\s+/)[0] !== hash(text)) throw new Error('Uploaded artifact mismatch');
      }
      record.isolated = true; record.remoteHashesVerified = true;
      result = await sandbox.commands.run('env', { args: ['-i', 'PATH=/usr/local/bin:/usr/bin:/bin', 'node', '/workspace/proof/check.mjs'], timeoutMs: 20000 });
    } else {
      local = await mkdtemp(path.join(tmpdir(), 'quorumpatch-synthetic-'));
      for (const [name, text] of Object.entries(files)) await writeFile(path.join(local, name), text);
      const r = spawnSync(process.execPath, [path.join(local, 'check.mjs')], { encoding: 'utf8', timeout: 20000, env: { SystemRoot: process.env.SystemRoot ?? '' } });
      result = { exitCode: r.status, stdout: r.stdout };
    }
    const report = JSON.parse(result.stdout.trim());
    record.pass = result.exitCode === expectedExit && report.total === cases.length && (expectedExit === 1 ? report.passed === 0 && report.failures.length === 1 && report.failures[0].code === 'quantity_ignored' : report.passed === cases.length && report.failures.length === 0);
    record.report = report;
  } catch { record.pass = false; record.blocked = true; }
  finally {
    try { if (sandbox) await sandbox.kill(); if (local) await rm(local, { recursive: true }); record.cleanupConfirmed = true; } catch { record.cleanupConfirmed = false; }
  }
  records.push(record);
  console.log(role + ': ' + (record.pass && record.cleanupConfirmed ? 'PASS' : 'BLOCKED'));
  if (!record.pass || !record.cleanupConfirmed) break;
}
const receipt = { schemaVersion: 1, example: 'original-synthetic-quantity-example', mode: cloud ? 'solari-cloud' : 'local-process-not-security-isolated', autonomousRepair: false, independentTestAuthors: false, productionWrites: false, roles: records, pass: records.length === 4 && records.every(r => r.pass && r.cleanupConfirmed) };
await mkdir('outputs', { recursive: true });
await writeFile('outputs/synthetic-proof.json', JSON.stringify({ ...receipt, sha256: hash(JSON.stringify(receipt)) }, null, 2));
console.log('Receipt saved locally. ' + (receipt.pass ? 'All stages passed.' : 'Run blocked.'));
if (!receipt.pass) process.exitCode = 1;
