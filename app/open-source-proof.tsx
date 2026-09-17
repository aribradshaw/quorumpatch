'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy } from 'lucide-react';
import ProductShell from './product-shell';
import results from '../public/open-source-results.json';

const labels = [
  'Original',
  'Quick fix',
  'Extra checks',
  'Better patch',
  'Verify patch',
  'Undo patch',
];
const stageTitles = [
  'Reproduce the report.',
  'A passing test. An incomplete fix.',
  'The extra check catches it.',
  'Apply the candidate patch.',
  'Check the surrounding behavior.',
  'Take the repair away.',
];
export default function OpenSourceProof({
  guided = false,
}: {
  guided?: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const [stage, setStage] = useState(guided ? 0 : 2);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const item = results.cases[selected];
  const run = item.stages[stage];
  const command = `npm run proof:cloud -- --case=${item.id}`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }
  const description =
    stage === 0
      ? item.problem
      : stage <= 2
        ? item.trap
        : stage <= 4
          ? item.fix
          : 'The original source is restored byte for byte. The reported failure returns.';
  return (
    <ProductShell>
      <header className="qp-heading">
        <h1>
          {guided
            ? 'A green check isn’t enough.'
            : 'Open source. Open evidence.'}
        </h1>
        <p>
          {guided
            ? 'Follow an incomplete fix until the tests catch it.'
            : 'Three reported bugs. Pinned source. Reproducible Solari runs.'}
        </p>
      </header>
      <div className="qp-projects" aria-label="Open-source cases">
        {results.cases.map((c, index) => (
          <button
            key={c.id}
            aria-pressed={selected === index}
            onClick={() => {
              setSelected(index);
              setStage(guided ? 0 : 2);
              setCopied(false);
              setCopyError(false);
            }}
          >
            <span>{c.name}</span>
            <small>
              {c.before} → {c.after}
            </small>
          </button>
        ))}
      </div>
      <section
        className="qp-workbench"
        aria-label="Recorded verification results"
      >
        <div className="qp-panel-bar">
          <a href={item.issueURL}>
            {item.repo} · Issue {item.issue} ↗
          </a>
          <span>Recorded Solari run</span>
        </div>
        <div className="qp-demo-layout">
          <nav className="qp-stages" aria-label="Recorded stages">
            {labels.map((label, index) => (
              <button
                key={label}
                aria-current={stage === index ? 'step' : undefined}
                onClick={() => setStage(index)}
              >
                <span className="qp-stage-number">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {label}
              </button>
            ))}
          </nav>
          <article className="qp-stage-main">
            <div className="qp-enter" key={item.id + stage} aria-live="polite">
              <span
                className={`qp-result-label ${run.outcome === 'fail' ? 'qp-bad' : 'qp-good'}`}
              >
                {run.outcome === 'fail' ? 'Test failed' : 'Tests passed'}{' '}
                <span>
                  {stage === 2
                    ? '· Quick fix rejected'
                    : stage === 5
                      ? '· Original failure restored'
                      : ''}
                </span>
              </span>
              <h2>{stageTitles[stage]}</h2>
              <p className="qp-stage-description">{description}</p>
              <div className="qp-observed">
                <div className="qp-observed-head">
                  <span>Assertion</span>
                  <span>Expected</span>
                  <span>Observed</span>
                </div>
                {run.checks.map((check) => (
                  <div className="qp-observed-row" key={check.id}>
                    <span>{check.id.replaceAll('-', ' ')}</span>
                    <code>{String(check.expected)}</code>
                    <code className={check.pass ? 'qp-good' : 'qp-bad'}>
                      {String(check.actual)}{' '}
                      <span aria-label={check.pass ? 'passed' : 'failed'}>
                        {check.pass ? '✓' : '×'}
                      </span>
                    </code>
                  </div>
                ))}
              </div>
            </div>
            <div className="qp-controls">
              <span className="qp-label">
                {(run.durationMs / 1000).toFixed(1)}s ·{' '}
                {run.cleanupConfirmed
                  ? 'Sandbox released'
                  : 'Cleanup unconfirmed'}
              </span>
              <button
                className="qp-primary"
                onClick={() => setStage(stage === 5 ? 0 : stage + 1)}
              >
                {stage === 5 ? 'Replay' : labels[stage + 1]}
                <ArrowRight size={16} />
              </button>
            </div>
          </article>
        </div>
      </section>
      <section className="qp-reproduce">
        <div>
          <h2>Don’t take our word for it.</h2>
          <p>Node 22.13+, the repo, and your own Solari key.</p>
        </div>
        <div>
          <div className="qp-copy">
            <code>{command}</code>
            <button
              className="qp-icon"
              aria-label="Copy reproduction command"
              onClick={copy}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <p role="status">
            {copyError
              ? 'Select and copy the command above.'
              : copied
                ? 'Copied.'
                : 'No cloud key? Use npm run proof:local.'}
          </p>
        </div>
      </section>
      <details>
        <summary>Source, patch & run details</summary>
        <div className="qp-details-links">
          <a href={item.sourceURL}>Pinned source ↗</a>
          <a href={`/patches/${item.id}.patch`} download>
            Candidate patch ↓
          </a>
          <a href="/open-source-results.json" download>
            Run results ↓
          </a>
          <a href="https://github.com/aribradshaw/quorumpatch#reproduce-the-open-source-cases">
            Setup instructions ↗
          </a>
        </div>
        <p>
          Source commit: <code>{item.commit}</code>
          <br />
          Run recorded: {results.recordedAt}
          <br />
          Source SHA-256: <code>{item.sha256}</code>
        </p>
      </details>
      <details>
        <summary>What this establishes</summary>
        <p>
          Candidate patches pass the listed checks at the pinned revisions.
          Tests and patches share an author; the quick fixes are deliberately
          incomplete controls. This is not independent certification, a full
          upstream test-suite run, or an upstream merge. Results are saved
          output, not a live run. Solari executes each stage in a separate
          sandbox; uploaded files are hash-checked and sandboxes released.
        </p>
      </details>
      <div className="qp-details-links">
        <Link href="/case-studies">Earlier anonymized case studies ↗</Link>
        <a href="https://github.com/aribradshaw/quorumpatch">GitHub ↗</a>
      </div>
    </ProductShell>
  );
}
