'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  Check,
  Download,
  Moon,
  Sun,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { pilot } from './generated-pilot';

const stages = [
  {
    title: 'Original fails',
    role: '01 / Reproducer',
    detail:
      'The old artifact triggers the named business assertion. Setup errors and timeouts do not count as reproduced bugs.',
  },
  {
    title: 'Repair passes',
    role: '02 / Builder replay',
    detail:
      'A separate sandbox executes the locally authored candidate. It did not independently invent the repair.',
  },
  {
    title: 'Extra checks pass',
    role: '03 / Held-out verifier',
    detail:
      'A separate sandbox runs checks withheld from the builder environment against the same candidate bytes. The test author is shared.',
  },
  {
    title: 'Failure returns',
    role: '04 / Counterfactual',
    detail:
      'A controlled change removes one claimed repair. The original business assertion must fail again, not merely crash.',
  },
];

export default function ProofDemo() {
  const [dark, setDark] = useState(false);
  const [selected, setSelected] = useState(0);
  const [stage, setStage] = useState(0);
  const [reviewed, setReviewed] = useState(false);
  const proof = pilot.cases[selected];
  const holdouts = pilot.cases.reduce((n, c) => n + c.holdouts, 0);
  const sandboxes = pilot.cases.reduce((n, c) => n + c.sandboxes, 0);
  return (
    <main
      className={`${dark ? 'dark ' : ''}min-h-screen bg-background text-foreground`}
    >
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="QuorumPatch home"
          >
            <span className="brand-mark" aria-hidden="true" />
            <span>
              <span className="block text-lg font-bold tracking-tight">
                QuorumPatch
              </span>
              <span className="text-xs text-muted-foreground">
                Repair evidence, before release.
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-muted-foreground sm:block">
              QUORUMPATCH / RECORDED EVIDENCE
            </span>
            <button
              type="button"
              aria-label="Toggle color theme"
              aria-pressed={dark}
              onClick={() => setDark(!dark)}
              className="rounded-lg border border-border bg-card p-3 focus-visible:outline-2 focus-visible:outline-offset-4"
            >
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:py-14">
        <section
          className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-end"
          aria-labelledby="demo-title"
        >
          <div>
            <p className="section-kicker">
              Real repair patterns. Anonymized evidence.
            </p>
            <h1
              id="demo-title"
              className="mt-4 max-w-3xl text-4xl leading-[1.08] tracking-tight sm:text-6xl"
            >
              A passing test is only
              <br className="hidden sm:block" /> part of the story.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Did this repair actually matter? Run the original, test the fix,
              then take the fix away.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <ShieldCheck size={18} /> QuorumPatch runs on Solari
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                [pilot.cases.length, 'real cases'],
                [holdouts, 'held-out checks'],
                [sandboxes, 'sandboxes released'],
              ].map(([n, label]) => (
                <div key={label}>
                  <p className="font-mono text-3xl font-semibold">{n}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-5 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
              Saved results, not a live run. Synthetic service adapters. No
              personal data, application credentials or production writes.
            </p>
          </div>
        </section>
        <section className="mt-10" aria-label="Proof cases">
          <div className="grid gap-3 md:grid-cols-3">
            {pilot.cases.map((c, i) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={selected === i}
                onClick={() => {
                  setSelected(i);
                  setStage(0);
                }}
                className={`rounded-xl border p-5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${selected === i ? 'border-primary bg-blue-soft' : 'border-border bg-card hover:bg-muted'}`}
              >
                <span className="font-mono text-xs uppercase tracking-wider text-brand-blue">
                  0{i + 1} / {c.category}
                </span>
                <span className="mt-2 block text-lg font-semibold">
                  {c.title}
                </span>
                <span className="mt-3 block text-xs text-muted-foreground">
                  {c.holdouts} held-out checks · 4 isolated roles
                </span>
              </button>
            ))}
          </div>
        </section>
        <section
          className="mt-6 overflow-hidden rounded-xl border border-border bg-card"
          aria-labelledby="case-title"
        >
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="section-kicker">
                Selected evidence / {proof.category}
              </p>
              <h2 id="case-title" className="mt-3 text-3xl tracking-tight">
                {proof.title}
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                {proof.problem}
              </p>
              <div className="mt-5 border-l-2 border-primary pl-4">
                <p className="text-sm font-semibold">The repair</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {proof.fix}
                </p>
              </div>
            </div>
            <div className="rounded-lg bg-muted p-5">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <RotateCcw size={17} /> The decisive check
              </p>
              <p className="mt-3 leading-relaxed">{proof.mutation}</p>
              <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
                This establishes necessity for the tested behavior, not proof of
                every possible outcome.
              </p>
            </div>
          </div>
          <div className="border-y border-border bg-background px-6 py-5 sm:px-8">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stages.map((s, i) => (
                <button
                  key={s.role}
                  type="button"
                  aria-pressed={stage === i}
                  onClick={() => setStage(i)}
                  className={`rounded-lg border p-4 text-left focus-visible:outline-2 focus-visible:outline-offset-4 ${stage === i ? 'border-primary bg-card' : 'border-border bg-transparent'}`}
                >
                  <span className="font-mono text-[11px] uppercase text-muted-foreground">
                    {s.role}
                  </span>
                  <span className="mt-2 flex items-center gap-2 font-semibold">
                    <Check size={16} className="text-success" />{' '}
                    {i === 2
                      ? `${proof.holdouts}/${proof.holdouts} extra checks`
                      : s.title}
                  </span>
                </button>
              ))}
            </div>
            <p
              aria-live="polite"
              className="mt-4 text-sm leading-relaxed text-muted-foreground"
            >
              {stages[stage].detail}
            </p>
          </div>
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-2">
            <div>
              <h3 className="font-semibold">What the extra checks cover</h3>
              <ul className="mt-4 space-y-3">
                {proof.checks.map((check) => (
                  <li
                    key={check}
                    className="flex gap-3 text-sm leading-relaxed"
                  >
                    <Check size={16} className="mt-0.5 shrink-0 text-success" />
                    {check}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">What this does not prove</h3>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {proof.boundary}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {proof.next}
              </p>

            </div>
          </div>
          <p className="border-t border-border px-6 py-5 text-sm text-muted-foreground">These are anonymized, author-reported case summaries. Private source, timestamps, identifiers and receipt hashes are withheld. The public synthetic runner demonstrates the method independently of these case studies.</p>
        </section>
        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <p className="section-kicker">The human still decides</p>
            <h2 className="mt-3 text-2xl">
              Evidence is not permission to ship.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              The orchestration was launched manually. Patches and tests share
              an author. Always-on ticket intake and durable job scheduling are
              not finished. Staff-screen acceptance is a separate review.
            </p>
            <button
              type="button"
              onClick={() => setReviewed(!reviewed)}
              aria-pressed={reviewed}
              className="mt-5 rounded-lg bg-primary px-5 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4"
              style={{ color: 'var(--primary-foreground)' }}
            >
              {reviewed
                ? 'Undo local review mark'
                : 'Mark demonstration reviewed locally'}
            </button>
            <p
              aria-live="polite"
              className="mt-3 text-xs leading-relaxed text-muted-foreground"
            >
              {reviewed
                ? 'Marked in this browser session only. No ticket changed and no code, email or deployment was approved.'
                : 'This only marks your review in this browser session. It cannot publish, deploy or send anything.'}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
            <p className="section-kicker">Take the evidence with you</p>
            <h2 className="mt-3 text-2xl">Small enough to inspect.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A redacted summary of all {pilot.cases.length} cases, including limits and
              privacy boundaries. No private code or sandbox handles.
            </p>
            <a
              href="/pilot-proof.json"
              download
              className="mt-5 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-semibold"
            >
              <Download size={16} /> Download proof summary
            </a>
            <a href="/pilot-proof.json" target="_blank" rel="noreferrer" className="mt-3 block text-sm text-brand-blue">
              Open JSON summary in a new tab
            </a>
            <Link
              href="https://github.com/aribradshaw/quorumpatch"
              className="mt-5 flex items-center gap-2 text-sm text-brand-blue"
            >
              Source and reproducible synthetic example <ArrowUpRight size={15} />
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              Public source uses synthetic examples. No client systems are connected.
            </p>
          </div>
        </section>
        <footer className="mt-10 flex flex-col justify-between gap-4 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>QuorumPatch · Built with Solari · Public showcase</p>
          <p>Original fails → Repair passes → Failure returns</p>
        </footer>
      </div>
    </main>
  );
}
