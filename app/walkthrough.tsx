'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RotateCcw } from 'lucide-react';
import ProductShell from './product-shell';

const stages = ['Reproduce', 'Patch', 'Extra checks', 'Remove fix'];
const titles = [
  'Three items. Charged for one.',
  'Include the quantity.',
  'Try the edge cases.',
  'The same bug comes back.',
];
const descriptions = [
  'The total ignores quantity. Three items at $1.25 should cost $3.75.',
  'The prepared patch multiplies the unit price by the quantity.',
  'Check more than the original example: multiple items, a free item, an empty cart, and a single item.',
  'Undoing the multiplication restores the original failure. The change matters for this test.',
];
const checks = [
  [99, 2, 198],
  [0, 8, 0],
  [5, 0, 0],
  [7, 1, 7],
];
const money = (cents: number) => '$' + (cents / 100).toFixed(2);

export default function Walkthrough() {
  const [stage, setStage] = useState(0);
  const [reached, setReached] = useState(0);
  const patched = stage === 1 || stage === 2;
  const total = patched ? 125 * 3 : 125;
  function advance() {
    const next = Math.min(stage + 1, 3);
    setStage(next);
    setReached((value) => Math.max(value, next));
  }
  return (
    <ProductShell>
      <header className="qp-heading">
        <h1>Don’t trust the green check.</h1>
        <p>Follow a patch through four verification steps.</p>
      </header>
      <section
        className="qp-workbench"
        aria-label="Interactive quantity bug walkthrough"
      >
        <div className="qp-panel-bar">
          <span>QUANTITY BUG</span>
          <span>Guided replay · {stage + 1} / 4</span>
        </div>
        <div className="qp-demo-layout">
          <nav className="qp-stages" aria-label="Verification steps">
            {stages.map((label, index) => (
              <button
                key={label}
                disabled={index > reached}
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
          <div className="qp-stage-main">
            <div className="qp-enter" key={stage} aria-live="polite">
              <h2>{titles[stage]}</h2>
              <p className="qp-stage-description">{descriptions[stage]}</p>
              <pre className="qp-code">
                <code>
                  {'amountDue(unit, quantity) {\n  return unit'}
                  {patched ? (
                    <span className="qp-good"> * quantity</span>
                  ) : stage === 3 ? (
                    <del> * quantity</del>
                  ) : null}
                  {';\n}'}
                </code>
              </pre>
              {stage === 2 ? (
                <ul className="qp-test-list">
                  {checks.map(([unit, quantity, expected]) => (
                    <li key={`${unit}-${quantity}`}>
                      <span>
                        {money(unit)} × {quantity} = {money(unit * quantity)}
                      </span>
                      <b
                        className={
                          unit * quantity === expected ? 'qp-good' : 'qp-bad'
                        }
                      >
                        {unit * quantity === expected ? 'Pass' : 'Fail'}
                      </b>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="qp-result">
                  <span>
                    Total for 3 items
                    <br />
                    Expected {money(375)}
                  </span>
                  <strong className={total === 375 ? 'qp-good' : 'qp-bad'}>
                    {money(total)}
                  </strong>
                  <span className={total === 375 ? 'qp-good' : 'qp-bad'}>
                    {total === 375 ? 'Pass' : 'Fail'}
                  </span>
                </div>
              )}
            </div>
            <div className="qp-controls">
              <button
                className="qp-reset"
                onClick={() => {
                  setStage(0);
                  setReached(0);
                }}
              >
                <RotateCcw size={14} />
                Restart
              </button>
              {stage < 3 ? (
                <button className="qp-primary" onClick={advance}>
                  {
                    ['Apply the patch', 'Check more inputs', 'Remove the fix'][
                      stage
                    ]
                  }
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link className="qp-primary" href="/demo">
                  Explore case studies
                  <ArrowRight size={16} />
                </Link>
              )}
            </div>
            {stage === 3 && (
              <p className="qp-replay-note">
                Evidence for review, not automatic approval to ship.
              </p>
            )}
          </div>
        </div>
      </section>
      <p className="qp-replay-note">
        Synthetic example, replayed in your browser. No live Solari run.{' '}
        <a href="https://github.com/aribradshaw/quorumpatch/blob/main/scripts/synthetic-proof.mjs">
          Run the source yourself ↗
        </a>
      </p>
    </ProductShell>
  );
}
