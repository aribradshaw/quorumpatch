'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Moon,
  Play,
  RotateCcw,
  Sun,
} from 'lucide-react';
import './marketing.css';

export default function Marketing() {
  const [dark, setDark] = useState(false);
  const [removed, setRemoved] = useState(false);
  return (
    <main className={`marketing ${dark ? 'marketing-dark' : ''}`}>
      <header className="mk-nav mk-wrap">
        <Link href="/" className="mk-brand">
          <span className="brand-mark" aria-hidden="true" />
          QuorumPatch
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/demo" className="mk-nav-proof">
            The evidence <ArrowUpRight size={15} />
          </Link>
          <button
            className="mk-theme"
            onClick={() => setDark((value) => !value)}
            aria-label="Toggle color theme"
            aria-pressed={dark}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </header>

      <section className="mk-hero mk-wrap">
        <p className="mk-eyebrow">EVIDENCE FOR AI-WRITTEN CODE</p>
        <h1>
          Your agent wrote the fix.
          <br />
          <span>Prove it.</span>
        </h1>
        <p className="mk-intro">
          Reproduce the bug. Test the patch. Take the fix away.
          <br className="mk-desktop-break" /> Know what changed before you ship.
        </p>
        <div className="mk-actions">
          <Link className="mk-cta" href="/demo">
            Explore the proof <ArrowRight size={18} />
          </Link>
          <Link className="mk-watch" href="/demo">Explore the cases <ArrowUpRight size={15} /></Link>
        </div>
        <p className="mk-hero-note">
          Real application code. Synthetic data. Human approval.
        </p>
      </section>



      <section
        className="mk-product mk-wrap"
        aria-label="Interactive recorded checkout proof"
      >
        <div className="mk-window">
          <div className="mk-window-top">
            <span className="mk-window-label">CHECKOUT / PACKAGE PRICING</span>
            <span>Anonymized QuorumPatch case</span>
          </div>
          <div className="mk-proof-body">
            <div className="mk-proof-context">
              <p className="mk-small-label">THE BUG</p>
              <h2>
                Right offer.
                <br /> Wrong price.
              </h2>
              <p>
                A package resolved to the wrong catalog entry. The repair
                corrected the mapping.
              </p>
            </div>
            <div className="mk-run">
              <div className="mk-run-row">
                <span>
                  <span className="mk-step">01</span> Original
                </span>
                <span className="mk-price">Wrong</span>
                <span className="mk-verdict mk-fail">Fails</span>
              </div>
              <div className="mk-run-row">
                <span>
                  <span className="mk-step">02</span> Repaired
                </span>
                <span className="mk-price">Right</span>
                <span className="mk-verdict mk-pass">Passes</span>
              </div>
              <div className={`mk-counter ${removed ? 'is-removed' : ''}`}>
                <div className="mk-run-row">
                  <span>
                    <span className="mk-step">03</span>{' '}
                    {removed ? 'Fix removed' : 'The decisive test'}
                  </span>
                  <span
                    key={String(removed)}
                    className="mk-price mk-price-change"
                  >
                    {removed ? 'Wrong' : '→'}
                  </span>
                  <span className={`mk-verdict ${removed ? 'mk-fail' : ''}`}>
                    {removed ? 'Fails again' : 'Inspect'}
                  </span>
                </div>
                <div className="mk-counter-bottom">
                  <p aria-live="polite">
                    {removed
                      ? 'Same bug. Same failure. This change mattered.'
                      : 'Does the bug return when we undo the repair?'}
                  </p>
                  <button
                    onClick={() => setRemoved((value) => !value)}
                    aria-pressed={removed}
                  >
                    <RotateCcw size={14} />
                    {removed ? 'Reset view' : 'Remove the fix'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="mk-window-bottom">
            <span>Isolated runs. Reviewable evidence.</span>
            <Link href="/demo">
              Inspect the full receipt <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
        <p className="mk-caption">
          Illustration of a recorded result. Client details and amounts omitted.
        </p>
      </section>

      <section className="mk-bottom mk-wrap">
        <div>
          <h2>
            Ship with evidence.
            <br />
            Not just confidence.
          </h2>
        </div>
        <div>
          <p>
            A working verification prototype. Locally authored patches and
            tests, isolated cloud runs, and a person at the release gate.
          </p>
          <Link href="/demo" className="mk-text-link">
            See the results and their limits <ArrowRight size={17} />
          </Link>
        </div>
      </section>
      <footer className="mk-footer mk-wrap">
        <Link href="/" className="mk-brand">
          QuorumPatch
        </Link>
        <span>Built by Ari Bradshaw · Powered by Solari</span>
        <Link href="/pilot-proof.json" prefetch={false}>
          Proof summary <ArrowUpRight size={13} />
        </Link>
      </footer>
    </main>
  );
}
