import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';
import { sha256 } from './proof-core.mjs';
import { snapshotComplete } from './snapshot-evidence.mjs';
import { sanitizeReplay } from './replay-sanitize.mjs';

const run = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/.test(run ?? ''))
  throw Error('Provide a saved snapshot run timestamp');
const root = path.resolve('outputs/snapshot', run);
const receipt = JSON.parse(
  await readFile(path.join(root, 'results.json'), 'utf8'),
);
if (!receipt.pass || !snapshotComplete(receipt, true))
  throw Error('Full browser experiment and cleanup must be confirmed');
const raw = await readFile(path.join(root, 'browser-replay-private.ndjson'));
if (sha256(raw) !== receipt.browserRecording.sha256)
  throw Error('Recording hash mismatch');
const decoded = raw[0] === 31 && raw[1] === 139 ? gunzipSync(raw) : raw;
const events = sanitizeReplay(
  decoded
    .toString('utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line)),
);
const replay = JSON.stringify(events);
const publicReceipt = {
  ...receipt,
  browserRecording: {
    downloaded: true,
    bytes: raw.length,
    sanitized: true,
    publicSha256: sha256(replay + '\n'),
    publicEvents: events.length,
    note: 'Provider DOM replay with endpoint URLs replaced and scripts and nonstandard events removed. Not a video or independent attestation.',
  },
};
const serialized = JSON.stringify(publicReceipt, null, 2);
if (
  /slr_live_|pt_token|x-pinetree-preview-token|sandboxId|sessionId|Bearer\s|https?:\/\//i.test(
    serialized + replay,
  )
)
  throw Error('Public artifact boundary failed');
await writeFile('public/snapshot-replay.json', replay + '\n');
await writeFile('public/snapshot-results.json', serialized + '\n');
console.log(
  'Exported sanitized snapshot receipt and DOM replay. Visual review still required.',
);
