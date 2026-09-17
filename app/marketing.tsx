'use client';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductShell from './product-shell';
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
        </div>
      </section>
      <Link className="qp-preview" href="/walkthrough">
        <div className="qp-panel-bar">
          <span>QUANTITY BUG</span>
          <span>Interactive walkthrough ↗</span>
        </div>
        <div className="qp-preview-body">
          <div>
            <span className="qp-label">One small change.</span>
            <h2>
              Three items.
              <br />
              One item’s price.
            </h2>
            <code>
              return unit <span className="qp-good">* quantity</span>;
            </code>
          </div>
          <div className="qp-preview-results">
            <div>
              <span>Original</span>
              <b className="qp-bad">$1.25</b>
            </div>
            <div>
              <span>Patched</span>
              <b className="qp-good">$3.75</b>
            </div>
            <div>
              <span>Fix removed</span>
              <b className="qp-bad">$1.25</b>
            </div>
          </div>
        </div>
      </Link>
    </ProductShell>
  );
}
