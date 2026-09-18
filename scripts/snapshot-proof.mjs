import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { SolariClient } from '@solarisdk/sdk';
import { Solari } from '@solarisdk/browser';
import { sha256, assess } from './proof-core.mjs';
import { snapshotComplete } from './snapshot-evidence.mjs';
import { createRequire } from 'node:module';

// Only synthetic fixtures enter these machines. Provider handles stay in outputs/.
if (!process.env.SOLARI_API_KEY) throw Error('SOLARI_API_KEY required');
const client = new SolariClient({ apiKey: process.env.SOLARI_API_KEY });
const require = createRequire(import.meta.url);
const { cases } = require('./retry-case/frozen-checks.cjs');
const fixture = new URL('./retry-case/', import.meta.url);
const original = await readFile(new URL('original.cjs', fixture), 'utf8');
const candidate = await readFile(new URL('candidate.cjs', fixture), 'utf8');
const incomplete = await readFile(new URL('incomplete.cjs', fixture), 'utf8');
const harness = await readFile(new URL('frozen-checks.cjs', fixture), 'utf8');
const webApp = await readFile(new URL('web-app.cjs', fixture), 'utf8');
const withBrowser = process.argv.includes('--browser');
const browsers = withBrowser
  ? new Solari({ apiKey: process.env.SOLARI_API_KEY })
  : null;
const startedAt = new Date().toISOString();
const output = path.resolve(
  'outputs/snapshot',
  startedAt.replaceAll(/[:.]/g, '-'),
);
await mkdir(output, { recursive: true });
const privateState = { sandboxIds: [], snapshotId: null };
const receipt = {
  schemaVersion: 1,
  kind: 'synthetic-snapshot-experiment',
  startedAt,
  stages: [],
  cleanup: [],
  pass: false,
  limitations: [
    'Sequential forks from one snapshot, not a concurrent stress test.',
    'Tests establish specific file and environment boundaries, not a sandbox escape assessment.',
    'No billing or performance superiority claim.',
  ],
};
let live, snapshotId, browser;
const persist = () =>
  writeFile(
    path.join(output, 'provider-private.json'),
    JSON.stringify(privateState, null, 2),
  );
async function check(name, action) {
  const start = Date.now();
  const evidence = await action();
  receipt.stages.push({
    name,
    pass: true,
    durationMs: Date.now() - start,
    ...evidence,
  });
  console.log(name + ': confirmed');
}
async function create(fromSnapshot) {
  const machine = await client.sandboxes.create({
    template: 'base',
    timeoutMs: 120000,
    lifecycle: { onTimeout: 'kill' },
    ...(fromSnapshot ? { fromSnapshot } : {}),
    metadata: { purpose: 'quorumpatch-snapshot-proof' },
  });
  live = machine;
  privateState.sandboxIds.push(machine.id);
  await persist();
  await machine.connect();
  return machine;
}
async function release() {
  if (!live) return;
  const id = live.id;
  await live.kill();
  let gone = false;
  try {
    const view = await client.sandboxes.get(id);
    gone = ['stopped', 'killed', 'terminated'].includes(view.state);
  } catch (error) {
    if (error.status === 404) gone = true;
    else throw error;
  }
  assert.equal(gone, true, 'Sandbox release readback');
  receipt.cleanup.push({ resource: 'sandbox', confirmed: true });
  live = null;
}
async function command(script) {
  const result = await live.commands.run('node', {
    args: ['-e', script],
    timeoutMs: 15000,
  });
  assert.equal(result.exitCode, 0, 'Remote check failed');
  return result.stdout.trim();
}
async function verifySource(content) {
  assert.equal(
    await command(
      "process.stdout.write(require('crypto').createHash('sha256').update(require('fs').readFileSync('/workspace/qp/subject.cjs')).digest('hex'))",
    ),
    sha256(content),
  );
  return { sourceSha256: sha256(content) };
}
async function evaluate(expectation) {
  const result = await live.commands.run('env', {
    args: [
      '-i',
      'PATH=/usr/local/bin:/usr/bin:/bin',
      'node',
      '/workspace/qp/check.cjs',
      './subject.cjs',
    ],
    timeoutMs: 15000,
  });
  const assessment = assess(
    result,
    cases.map(([id, , expected]) => ({ id, expected })),
    expectation,
  );
  assert.equal(assessment.verdict, 'confirmed');
  return { assessment };
}
async function browserFlow(expected) {
  if (!browser) {
    browser = await browsers.launch({ recording: true });
    privateState.browserSessionId = browser.id;
    await persist();
  }
  const preview = await live.previewUrl(3000);
  const origin = new URL(preview.url).origin;
  const context = await browser.newContext();
  if (preview.token)
    await context.setExtraHTTPHeaders({
      'x-pinetree-preview-token': preview.token,
    });
  const page = await context.newPage();
  page.setDefaultTimeout(20000);
  try {
    const response = await page.goto(origin, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    assert.equal(response.status(), 200);
    await page.getByRole('button', { name: 'Send batch', exact: true }).click();
    await page
      .getByText('B failed. Retry the batch.', { exact: true })
      .waitFor();
    await page
      .getByRole('button', { name: 'Retry batch', exact: true })
      .click();
    await page.getByText('Complete', { exact: true }).waitFor();
    const actual = await page.locator('#attempts').innerText();
    assert.equal(actual, expected.join(' → '));
    // Screenshots contain only synthetic page content. Raw recording remains private pending review.
    await page.screenshot({
      path: path.join(output, `browser-${receipt.stages.length}.png`),
    });
    return {
      observedSendOrder: actual,
      expectedSendOrder: expected.join(' → '),
      browserAssertionsPassed: true,
    };
  } finally {
    await context.close();
  }
}
try {
  await check('prepare', async () => {
    await create();
    await command("require('fs').mkdirSync('/workspace/qp',{recursive:true})");
    await live.files.write('/workspace/qp/subject.cjs', original);
    await live.files.write('/workspace/qp/check.cjs', harness);
    if (withBrowser) {
      await live.files.write('/workspace/qp/web-app.cjs', webApp);
      const processHandle = await live.commands.start('env', {
        args: [
          '-i',
          'PATH=/usr/local/bin:/usr/bin:/bin',
          'node',
          '/workspace/qp/web-app.cjs',
        ],
      });
      // Closing the source control channel after snapshot rejects its pending
      // command completion. Observe that promise without waiting for the server.
      void processHandle.wait().catch(() => {});
      await command(
        "fetch('http://localhost:3000/state').then(r=>{if(!r.ok)process.exitCode=1}).catch(()=>process.exitCode=1)",
      );
    }
    return verifySource(original);
  });
  await check('snapshot', async () => {
    snapshotId = await live.snapshot('quorumpatch-clean-baseline');
    privateState.snapshotId = snapshotId;
    await persist();
    await client.sandboxes.getSnapshot(snapshotId);
    return { providerReadback: true };
  });
  await release();
  await check('original-fork', async () => {
    await create(snapshotId);
    await verifySource(original);
    return evaluate('fail');
  });
  if (withBrowser)
    await check('browser-original', () => browserFlow(['A', 'B', 'A', 'B']));
  await check('contaminate-first-fork', async () => {
    await live.files.write(
      '/workspace/qp/first-fork-only.txt',
      'invented-marker',
    );
    assert.equal(
      await live.files.readText('/workspace/qp/first-fork-only.txt'),
      'invented-marker',
    );
    return { markerPresent: true };
  });
  await release();
  await check('incomplete-fork', async () => {
    await create(snapshotId);
    await live.files.write('/workspace/qp/subject.cjs', incomplete);
    await verifySource(incomplete);
    const evidence = await evaluate('fail');
    assert.equal(
      evidence.assessment.checks.find((row) => row.id === cases[0][0]).pass,
      true,
    );
    assert.equal(
      evidence.assessment.checks.find((row) => row.id === cases[1][0]).pass,
      false,
    );
    return evidence;
  });
  await release();
  await check('fresh-fork-separation', async () => {
    await create(snapshotId);
    await verifySource(original);
    const state = JSON.parse(
      await command(
        "console.log(JSON.stringify({marker:require('fs').existsSync('/workspace/qp/first-fork-only.txt'),providerKeyPresent:!!process.env.SOLARI_API_KEY}))",
      ),
    );
    assert.deepEqual(state, { marker: false, providerKeyPresent: false });
    return state;
  });
  await check('candidate', async () => {
    await live.files.write('/workspace/qp/subject.cjs', candidate);
    await verifySource(candidate);
    return evaluate('pass');
  });
  if (withBrowser)
    await check('browser-candidate', () => browserFlow(['A', 'B', 'B']));
  await check('rewind', async () => {
    await live.files.write(
      '/workspace/qp/after-snapshot.txt',
      'invented-state',
    );
    await live.revert(snapshotId);
    await live.connect();
    const hash = await verifySource(original);
    assert.equal(
      await command(
        "console.log(require('fs').existsSync('/workspace/qp/after-snapshot.txt'))",
      ),
      'false',
    );
    return { ...hash, contaminationRemoved: true, ...(await evaluate('fail')) };
  });
  if (withBrowser)
    await check('browser-rewind', () => browserFlow(['A', 'B', 'A', 'B']));
} catch (error) {
  // Do not publish provider exception strings, signed endpoints, or tokens.
  receipt.error = {
    name: error.name,
    status: error.status ?? null,
    stageCount: receipt.stages.length,
  };
  console.error(
    'Experiment incomplete. Error type: ' +
      error.name +
      '; status: ' +
      (error.status ?? 'none'),
  );
} finally {
  if (browser) {
    try {
      const id = browser.id;
      await browser.close();
      await browsers.sessions.releaseAndWait(id);
      receipt.browserReleased = true;
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const replay = await browsers.sessions.downloadReplay(id);
          await writeFile(
            path.join(output, 'browser-replay-private.ndjson'),
            replay,
          );
          receipt.browserRecording = {
            downloaded: true,
            bytes: replay.length,
            sha256: sha256(replay),
          };
          break;
        } catch {
          if (attempt === 5) receipt.browserRecording = { downloaded: false };
          else await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    } catch {
      receipt.browserReleased = false;
    }
  }
  if (browsers) {
    try {
      await browsers.close();
    } catch {
      receipt.browserReleased = false;
    }
  }
  try {
    await release();
  } catch {
    receipt.cleanup.push({ resource: 'sandbox', confirmed: false });
  }
  if (snapshotId) {
    try {
      await client.sandboxes.deleteSnapshot(snapshotId);
      let gone = false;
      try {
        await client.sandboxes.getSnapshot(snapshotId);
      } catch (error) {
        if (error.status === 404) gone = true;
        else throw error;
      }
      assert.equal(gone, true);
      receipt.cleanup.push({ resource: 'snapshot', confirmed: true });
    } catch {
      receipt.cleanup.push({ resource: 'snapshot', confirmed: false });
    }
  }
  receipt.finishedAt = new Date().toISOString();
  receipt.pass = snapshotComplete(receipt, withBrowser);
  await writeFile(
    path.join(output, 'results.json'),
    JSON.stringify(receipt, null, 2) + '\n',
  );
  console.log('Evidence: ' + path.relative(process.cwd(), output));
  if (!receipt.pass) process.exitCode = 1;
}
