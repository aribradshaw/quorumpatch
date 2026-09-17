import { readFile, writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { transform } from 'esbuild';
import { SolariClient } from '@solarisdk/sdk';
import { cases } from './open-source-cases.mjs';
import { sha256, verifyHash, runStage } from './proof-core.mjs';

const cloud = process.argv.includes('--cloud');
const publish = process.argv.includes('--publish');
if (publish && !cloud) throw new Error('Only cloud results can be published');
if (cloud && !process.env.SOLARI_API_KEY)
  throw new Error('SOLARI_API_KEY is required');
const client = cloud
  ? new SolariClient({ apiKey: process.env.SOLARI_API_KEY })
  : null;
const selected = process.argv
  .find((arg) => arg.startsWith('--case='))
  ?.slice(7);
if (selected && !cases.some((c) => c.id === selected))
  throw new Error('Unknown case');
if (publish && selected) throw new Error('Publish all three cases together');
await mkdir('outputs/opensource', { recursive: true });
const results = [];
async function download(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error('Source download failed');
  return res.text();
}
for (const c of cases.filter((c) => !selected || c.id === selected)) {
  const baseURL = `https://raw.githubusercontent.com/${c.repo}/${c.commit}/`;
  const source = await download(baseURL + c.path);
  verifyHash(source, c.sha256);
  const license = await download(baseURL + 'LICENSE');
  if (!license.includes('Permission is hereby granted'))
    throw new Error('License review required');
  const fixed = c.patch(source),
    bad = c.bad(source);
  const caseDir = `outputs/opensource/${c.id}`;
  await mkdir(caseDir, { recursive: true });
  await writeFile(caseDir + '/original.txt', source);
  await writeFile(caseDir + '/candidate.txt', fixed);
  await writeFile(caseDir + '/LICENSE', license);
  let diff;
  try {
    diff = execFileSync(
      'git',
      ['diff', '--no-index', '--', 'original.txt', 'candidate.txt'],
      { cwd: caseDir, encoding: 'utf8' },
    );
  } catch (error) {
    if (error.status !== 1) throw error;
    diff = error.stdout;
  }
  diff = diff
    .replaceAll('a/original.txt', 'a/' + c.path)
    .replaceAll('b/candidate.txt', 'b/' + c.path);
  await writeFile(caseDir + '/candidate.patch', diff);
  const plans = [
    ['original', source, c.repro, 'fail'],
    ['bad-repro', bad, c.repro, 'pass'],
    ['bad-checks', bad, c.checks, 'fail'],
    ['patch-repro', fixed, c.repro, 'pass'],
    ['patch-checks', fixed, c.checks, 'pass'],
    ['undo', source, c.repro, 'fail'],
  ];
  const stages = [];
  for (const [id, code, checks, expectation] of plans) {
    const compiled = c.path.endsWith('.ts')
      ? (
          await transform(code, {
            loader: 'ts',
            format: 'cjs',
            target: 'node18',
          })
        ).code
      : code;
    const harness = `const subject=require('./subject.cjs');\nconst checks=[${checks.map((check) => `(()=>{const expected=${JSON.stringify(check.expected)}; const actual=(${check.expr});return {id:${JSON.stringify(check.id)},expected,actual,pass:JSON.stringify(actual)===JSON.stringify(expected)};})()`).join(',')}];\nconsole.log(JSON.stringify({protocol:1,checks}));process.exitCode=checks.every(c=>c.pass)?0:1;`;
    const files = {
      'subject.cjs': compiled,
      'check.cjs': harness,
      LICENSE: license,
    };
    let sandbox, local, child;
    const artifacts = Object.fromEntries(
      Object.entries(files).map(([name, text]) => [name, sha256(text)]),
    );
    // Provision separately so a setup timeout cannot race an unassigned sandbox handle.
    if (cloud)
      sandbox = await client.sandboxes.create({
        template: 'base',
        timeoutMs: 60000,
      });
    const record = await runStage({
      checks,
      expectation,
      timeoutMs: 45000,
      execute: async () => {
        if (sandbox) {
          await sandbox.connect();
          const prep = await sandbox.commands.run('mkdir', {
            args: ['-p', '/workspace/proof'],
            timeoutMs: 5000,
          });
          if (prep.exitCode !== 0) throw new Error('setup_failed');
          for (const [name, text] of Object.entries(files)) {
            await sandbox.files.write('/workspace/proof/' + name, text);
            const digest = await sandbox.commands.run('sha256sum', {
              args: ['/workspace/proof/' + name],
              timeoutMs: 5000,
            });
            if (
              digest.exitCode !== 0 ||
              digest.stdout.trim().split(/\s+/)[0] !== artifacts[name]
            )
              throw new Error('artifact_mismatch');
          }
          return sandbox.commands.run('env', {
            args: [
              '-i',
              'PATH=/usr/local/bin:/usr/bin:/bin',
              'node',
              '/workspace/proof/check.cjs',
            ],
            timeoutMs: 15000,
          });
        }
        local = await mkdtemp(path.join(tmpdir(), 'qp-public-'));
        for (const [name, text] of Object.entries(files))
          await writeFile(path.join(local, name), text);
        return new Promise((resolve, reject) => {
          child = spawn(process.execPath, [path.join(local, 'check.cjs')], {
            env: { SystemRoot: process.env.SystemRoot ?? '' },
            windowsHide: true,
          });
          let stdout = '';
          child.stdout.on('data', (chunk) => (stdout += chunk));
          child.on('error', reject);
          child.on('close', (exitCode) => resolve({ exitCode, stdout }));
        });
      },
      cleanup: async () => {
        if (child && child.exitCode === null) child.kill();
        if (sandbox) await sandbox.kill();
        if (local) await rm(local, { recursive: true, force: true });
      },
    });
    stages.push({
      id,
      expectation,
      sourceSha256: sha256(code),
      artifacts,
      remoteHashesVerified:
        cloud &&
        !['artifact_mismatch', 'execution_failed', 'timeout'].includes(
          record.reason,
        ),
      ...record,
    });
    console.log(
      `${c.id}/${id}: ${record.verdict} (${record.outcome ?? record.reason})`,
    );
    if (record.verdict !== 'confirmed') break;
  }
  const { patch, bad: badFn, repro, checks, ...metadata } = c;
  results.push({
    ...metadata,
    issueURL: `https://github.com/${c.repo}/issues/${c.issue}`,
    sourceURL: `https://github.com/${c.repo}/blob/${c.commit}/${c.path}`,
    licenseURL: baseURL + 'LICENSE',
    candidateSha256: sha256(fixed),
    stages,
    pass:
      stages.length === 6 &&
      stages.every((s) => s.verdict === 'confirmed' && s.cleanupConfirmed),
  });
}
const receipt = {
  schemaVersion: 1,
  mode: cloud ? 'solari-cloud' : 'local-process-not-security-isolated',
  recordedAt: new Date().toISOString(),
  independentAttestation: false,
  independentTestAuthors: false,
  autonomousRepair: false,
  upstreamSubmitted: false,
  cases: results,
  pass: results.length > 0 && results.every((c) => c.pass),
};
const serialized = JSON.stringify(receipt, null, 2) + '\n';
await writeFile('outputs/opensource/results.json', serialized);
if (publish && receipt.pass && results.length === 3) {
  await mkdir('public/patches', { recursive: true });
  for (const c of results) {
    await writeFile(
      `public/patches/${c.id}.patch`,
      await readFile(`outputs/opensource/${c.id}/candidate.patch`),
    );
    await writeFile(
      `public/patches/${c.id}.LICENSE.txt`,
      await readFile(`outputs/opensource/${c.id}/LICENSE`),
    );
  }
  await writeFile('public/open-source-results.json', serialized);
}
if (!receipt.pass) process.exitCode = 1;
