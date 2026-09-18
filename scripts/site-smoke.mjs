import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sha256 } from './proof-core.mjs';
const base = new URL(process.argv[2] || 'http://localhost:3011');
if (!['localhost', '127.0.0.1'].includes(base.hostname))
  throw Error('Local preview only');
for (const [route, text] of [
  ['/', 'Fork the environment.'],
  ['/walkthrough', 'Fix it. Then rewind it.'],
  ['/demo', 'The run behind the replay.'],
  ['/open-source', 'Open source. Open evidence.'],
  ['/case-studies', 'QuorumPatch'],
  ['/synthetic', 'QuorumPatch'],
]) {
  const response = await fetch(new URL(route, base), {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, route);
  assert.ok(
    (await response.text()).includes(text),
    route + ' rendered expected page',
  );
  console.log(route + ': rendered');
}
for (const file of [
  'snapshot-results.json',
  'snapshot-replay.json',
  'evidence-review.md',
]) {
  const response = await fetch(new URL('/' + file, base), {
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, file);
  assert.equal(
    sha256(await response.text()),
    sha256(await readFile(new URL('../public/' + file, import.meta.url))),
    file + ' served bytes',
  );
  console.log(file + ': served bytes verified');
}
