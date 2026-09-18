'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductShell from './product-shell';
import results from '../public/snapshot-results.json';
export default function Marketing() {
  return (
    <ProductShell>
      <section className="qp-hero">
        <h1>
          Your agent wrote the fix.
          <br />
          <em>Prove it.</em>
        </h1>
        <p>
          Fork the environment. Test the repair. Rewind to prove what changed.
        </p>
        <div className="qp-actions">
          <Link href="/walkthrough" className="qp-primary">
            Watch the experiment <ArrowRight size={18} />
          </Link>
          <Link href="/demo">Inspect the evidence</Link>
        </div>
      </section>
      <Link className="qp-preview" href="/walkthrough">
        <div className="qp-panel-bar">
          <span>SNAPSHOT → REPAIR → REWIND</span>
          <span>Recorded QuorumPatch run ↗</span>
        </div>
        <div className="qp-preview-body">
          <div>
            <span className="qp-label">
              One starting point. Three versions. A real browser.
            </span>
            <h2>
              Retry the failure.
              <br />
              Not the success.
            </h2>
            <code>
              A → B → A → B{' '}
              <span className="qp-good">/ repaired: A → B → B</span>
            </code>
          </div>
          <div className="qp-preview-results">
            <div>
              <span>Original / browser</span>
              <b className="qp-bad">Duplicate</b>
            </div>
            <div>
              <span>Repair / browser</span>
              <b className="qp-good">
                {results.pass ? 'Verified' : 'Unconfirmed'}
              </b>
            </div>
            <div>
              <span>Rewind / browser</span>
              <b className="qp-bad">Duplicate returns</b>
            </div>
          </div>
        </div>
      </Link>
      <div className="qp-details-links">
        <span>Original synthetic workflow. Executed with Solari.</span>
        <Link href="/open-source">Explore three open-source cases ↗</Link>
      </div>
    </ProductShell>
  );
}
