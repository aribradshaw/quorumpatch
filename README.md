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

Open /walkthrough for an interactive, browser-only replay of the synthetic quantity example. Apply the prepared patch, inspect additional inputs, and remove the repair. This interface does not launch a live Solari run.

Open /demo for six anonymized real-code case studies. These are author-reported summaries of private runs, not independently verifiable public receipts. Client code, identities, ticket references, original amounts, precise dates and raw receipt fingerprints are deliberately absent.

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
