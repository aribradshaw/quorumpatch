# Evidence review

## Snapshot, fork, browser, rewind

The featured experiment starts a synthetic retry application in a Solari sandbox and snapshots the running machine. Sequential forks compare the original, a deliberately incomplete control and the first-agent candidate. The control passes the ordinary partial-retry check but fails the uncertain-response check; the candidate passes all seven frozen checks.

A real Solari browser clicks Send and Retry. The original produces A,B,A,B; the candidate produces A,B,B. Rewinding the repaired machine restores both the original source and starting application state, and the browser reproduces A,B,A,B again. A marker written in the first fork is absent in the later fork; a post-snapshot marker disappears after rewind. SOLARI_API_KEY is absent from the tested guest command environment. These are specific observations, not penetration tests or proof of complete secret isolation.

The full saved run confirms eleven stages, four sandbox releases and snapshot deletion with API readbacks, browser release and recording download. `snapshot-results.json` includes measured stage times, not a claim of speed or cost superiority. Source hashes are recorded for preparation and rewind; the runner also checks candidate/control source bytes before execution. The stored snapshot is deliberately deleted after the experiment; reproduction creates a new one from the public fixtures.

`snapshot-replay.json` is a sanitized provider DOM recording, not video. Public playback replaces endpoint URLs, removes scripts and nonstandard events, and never connects to Solari. The saved evidence includes a hash of that sanitized file. Each chapter plays a page excerpt from that recording, omitting the idle time between separate browser contexts; it does not run or simulate the application. API/console-history reconciliation remains unresolved.

Reproduce with `npm ci`, your `SOLARI_API_KEY`, and `npm run proof:snapshot:browser`. Raw recordings and provider handles stay in ignored outputs. Review before exporting a new public recording with `node scripts/export-snapshot.mjs <run-timestamp>`. The export does not deploy or push anything.

## A first-attempt repair, evaluated after checks were frozen

The new partial-batch example is original synthetic code, not copied client code or a new open-source issue. Operation A succeeds, B is rejected, and retrying the batch repeats A. The repaired send order is A,B,B instead of A,B,A,B.

Seven checks were hashed before a separate repair agent received the original source and contract. Its first candidate passed the visible reproduction and all seven unchanged checks. No second attempt was requested. The agent was instructed not to inspect the verification file, but shared filesystem access was not technically restricted. This is neither a security-isolated blind evaluation nor independent certification.

The checks cover retained receipts, uncertain timeouts, missing receipts, malformed responses, malformed prior state, preserved unrelated state, and empty batches. A deliberately incomplete control in the test suite passes the reproduction but fails the uncertain-retry check. That control is not attributed to the repair agent.

Run `npm ci` then `npm run proof:retry` without credentials. Optional `npm run proof:retry:cloud` uses your Solari key and provider allowance. Four stages: original fails, candidate reproducer passes, candidate frozen checks pass, undo fails. Future reruns replay the saved candidate; they do not repeat the agent experiment.

The model is single-worker, in-memory, and sequential. It does not establish durable exactly-once delivery, race safety, arbitrary-code safety, or production outcomes.

## Solari evidence and attribution

The new recorded run uses the official SDK against api.getsolari.com. Each of four separately created sandboxes was read back through the provider API, received hash-checked files, executed the test without application credentials, and was released. Subsequent GETs verified absence or a stopped state. Private run identifiers remain outside this public repository. The public receipt contains outcomes, hashes, lifecycle timings, and verification booleans, not provider-signed attestations.

The older three open-source cases retain their original runner receipts. Those receipts did not retain sandbox identifiers, so retrospective provider-history matching has not been established. The account console's sandbox history did not reconcile with the recorded September API runs during this review, including the new run. Cause and billing attribution remain unresolved. Do not describe the console as corroborating these runs or infer exact cost from its rounded credit balance. A narrow support question can be sent separately after approval.

No per-run price or speed superiority is claimed. Solari's useful role here is disposable remote execution environments and lifecycle management, not a claim that local reproduction is impossible.

## What to inspect

- `retry-results.json`: four-stage recorded execution, frozen hashes, limitations and lifecycle timing.
- `scripts/retry-case/`: original, first candidate, disclosed checks, task contract and freeze record.
- `tests/retry-proof.test.mjs`: negative control and evidence consistency checks.
- `open-source-results.json`: historical pinned upstream cases with their original limitations.

This review improves traceability; it does not resolve historical billing attribution or substitute for an outside human rerun.

## Fresh-snapshot reproduction

A second agent copied only the retry runner, verification core, disclosed fixtures, package manifest and lockfile into a fresh temporary directory. It installed dependencies with `npm ci --ignore-scripts` and ran `npm run proof:retry` without cloud credentials or existing outputs. All four expected outcomes reproduced: original failure, candidate reproduction pass, seven-check pass, and undo failure. This is an agent-reported local reproduction, not independent human attestation or a clean clone of an already published release.
