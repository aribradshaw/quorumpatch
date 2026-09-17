'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductShell from './product-shell';
import results from '../public/open-source-results.json';
export default function Marketing() {
  return (
    <ProductShell>
      <section className="qp-hero">
        <h1>
          Your agent wrote the fix.
          <br />
          <em>Prove it.</em>
        </h1>
        <p>Test the patch. Undo it. See if the bug comes back.</p>
        <div className="qp-actions">
          <Link href="/walkthrough" className="qp-primary">
            Try the walkthrough <ArrowRight size={18} />
          </Link>
          <Link href="/demo">Inspect the evidence</Link>
          <a href="/quorumpatch-demo.webm">Watch 82-second demo</a>
        </div>
      </section>
      <Link className="qp-preview" href="/walkthrough">
        <div className="qp-panel-bar">
          <span>BYTES / OPEN-SOURCE CASE</span>
          <span>Recorded Solari run ↗</span>
        </div>
        <div className="qp-preview-body">
          <div>
            <span className="qp-label">
              The test passed. The patch wasn’t ready.
            </span>
            <h2>
              Fix one number.
              <br />
              Break another.
            </h2>
            <code>
              1.050KB <span className="qp-good">→ 1.05KB</span>
            </code>
          </div>
          <div className="qp-preview-results">
            <div>
              <span>Quick fix / reported bug</span>
              <b className="qp-good">
                {results.cases[0].stages[1].outcome === 'pass'
                  ? 'Pass'
                  : 'Fail'}
              </b>
            </div>
            <div>
              <span>Quick fix / extra checks</span>
              <b className="qp-bad">
                {results.cases[0].stages[2].outcome === 'fail'
                  ? 'Rejected'
                  : 'Passed'}
              </b>
            </div>
            <div>
              <span>Better patch / extra checks</span>
              <b className="qp-good">
                {results.cases[0].stages[4].outcome === 'pass'
                  ? 'Pass'
                  : 'Fail'}
              </b>
            </div>
          </div>
        </div>
      </Link>
    </ProductShell>
  );
}
