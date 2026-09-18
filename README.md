# QuorumPatch

Your agent wrote the fix. Prove it.

QuorumPatch is a working repair-verification prototype built around isolated Solari witnesses. It asks four questions: does the original fail, does the patch pass, do held-out checks pass, and does removing the repair bring back the original failure?

## Try it

Node 22.13 or newer:

```sh
npm ci
npm run demo:local
npm run dev
```

Open /walkthrough for the recorded snapshot, fork, browser and rewind experiment. Open /demo for its evidence, and /open-source for the three pinned upstream bug examples. The replay reads sanitized saved DOM events; it does not launch billable sessions. The original synthetic introduction remains at /synthetic.

Open /case-studies for six earlier anonymized real-code summaries. Those earlier cases are author-reported summaries of private runs, not independently verifiable public receipts. Client code, identities, ticket references, original amounts, precise dates and raw receipt fingerprints are deliberately absent.

## New: partial success without duplicate retries

An original synthetic workflow now evaluates a separate agent's first repair against checks frozen before task dispatch. The first candidate passes all seven checks; the original resends an already accepted operation. This is an instruction-scoped experiment, not independently authored certification or a filesystem-isolated blind trial.

```sh
npm ci
npm run proof:retry
# Optional remote replay using your SOLARI_API_KEY:
npm run proof:retry:cloud
```

[Read the evidence review](public/evidence-review.md) and [four-stage cloud receipt](public/retry-results.json). The review also documents an unresolved mismatch between API-run evidence and console history. No per-run billing claim is made. Local reproduction needs no key; future runs replay the saved first candidate.

## Snapshot and browser experiment

`npm run proof:snapshot:browser` prepares the synthetic retry application, snapshots its running environment, creates sequential forks, and checks the original, a deliberately incomplete control, and the repair. A real Solari browser clicks through the original and repaired application, then checks that rewinding the machine restores the duplicate-send failure. File markers test specific fork-separation and rewind behavior. These are not sandbox escape tests or a general security certification.

This command requires your `SOLARI_API_KEY` and uses provider resources. It saves private provider handles and the raw browser recording only under ignored `outputs/snapshot/`. Do not publish that raw directory. The runner releases its sandboxes, browser session, and snapshot; cleanup or recording failures prevent a successful result. `npm run proof:snapshot` omits the browser and recording. There is no automatic Git push or website deployment.

## Reproduce the open-source cases

Node 22.13+ and Git are required. From a fresh checkout:

```sh
git clone https://github.com/aribradshaw/quorumpatch.git
cd quorumpatch
npm ci
npm run proof:local
```

For isolated Solari execution, set `SOLARI_API_KEY` in your environment (or an ignored `.env.local` containing only that key), then:

```sh
npm run proof:cloud
# Optional single case:
npm run proof:cloud -- --case=bytes
```

Cloud mode creates six short-lived sandboxes per case, eighteen for the full suite, and incurs provider usage. Local mode runs processes, not security sandboxes. Neither mode sends credentials into the test process. Only the three reviewed, pinned public modules are fetched; do not generalize local mode to arbitrary untrusted repositories.

| Case | Upstream report | Candidate scope | Bad-fix control |
| --- | --- | --- | --- |
| bytes | [Decimal formatting](https://github.com/visionmedia/bytes.js/issues/69) | Trailing fractional zero trimming | Breaks fixed-decimal mode |
| pluralize | [Camel-case uncountables](https://github.com/plurals/pluralize/issues/215) | Final camel-case uncountable token and predicates | Fixes Series only |
| ms | [Scientific-notation roundtrip](https://github.com/vercel/ms/issues/284) | Signed exponent parsing | Accepts positive exponents only |

Each source revision and SHA-256 is pinned in `scripts/open-source-cases.mjs`. Source drift stops the run. For `ms`, the full pinned TypeScript module is transpiled using the lockfile's esbuild before upload. The original source, prepared candidate and patch are saved under `outputs/opensource/<case>/`. Each downloaded upstream MIT license is retained. Apply a downloaded patch with `git apply` from a checkout of the corresponding pinned upstream commit.

The run writes `outputs/opensource/results.json`: assertion-level expected/actual values, source and uploaded-file hashes, stage duration (excluding provisioning), and cleanup status. A successful report means all six expected outcomes occurred, including intentional assertion failures. Infrastructure errors, invalid reports, hash mismatches, timeouts and cleanup failures block the run. After review, `npm run proof:cloud -- --publish` refreshes the public results and patch downloads only when all three cases succeed. Ordinary runs never overwrite the published evidence.

The deliberately incomplete patches are controls written for this demonstration, not rejected upstream contributions or claims about another agent. Candidate patches and checks share an author. These scoped checks are not the full upstream suites, independent attestation, or proof of universal correctness. No upstream PR has been submitted. Historical evidence is pinned; an open issue may later be fixed elsewhere.

### Inspect the evidence

- [Saved cloud output](public/open-source-results.json)
- [Candidate patches and licenses](public/patches/)
- [Failure-path tests](tests/proof-core.test.mjs)
- `npm test` checks result consistency and failure handling without a cloud key.
- [82-second silent walkthrough](public/quorumpatch-demo.webm): actual interface replay of the saved cloud results, with on-screen explanations.

The independently runnable example is original synthetic code, not a reconstruction of any client's implementation. Local mode is process isolation, not a security sandbox. Optional cloud mode launches four separate Solari sandboxes, verifies uploaded bytes and releases them:

```sh
npm run demo:cloud
```

Provide SOLARI_API_KEY through your environment or an ignored .env.local file. Cloud execution may incur provider charges. Never supply application credentials or real user records. Nothing deploys, sends a message or changes a ticket.

## Architecture

Original + reproducer → builder replay → held-out verifier → controlled counterfactual → human review.

The builder currently replays a supplied patch. It does not autonomously invent repairs. Tests share an author. Successful tests establish the tested behavior, not universal correctness or independent attestation. Failures in setup or transport are blocked runs, never reproduced bugs.

## Development and releases

Run `npm run verify` before release. Commit public-safe changes on main, then run `npm run release:push`. The shared @aribradshaw/devlog package advances the Phoenix-calendar year.month.update version, records the source commit, checks alignment, commits metadata and pushes normally. Repeating the command without a new source commit does not create another release.

`npm ci` installs a pre-push privacy and release gate. GitHub Actions repeats verification and prepares release metadata for changes made elsewhere. Do not bypass the hooks. These checks reduce accidental disclosure but cannot replace human review or identify every possible secret.

This repository is the public source of truth. Never merge private workspace history or automatically copy client artifacts into it. Bring in only individually reviewed public changes. Website deployment is separate from source publication.

## License

MIT for the source distributed here. No rights to private client code are granted or implied.
