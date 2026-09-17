'use client';
import { useState } from 'react';
import ProductShell from './product-shell';
import { pilot } from './generated-pilot';
export default function ProofDemo() {
  const [selected, setSelected] = useState(0);
  const item = pilot.cases[selected];
  return (
    <ProductShell>
      <header className="qp-heading">
        <h1>Evidence.</h1>
        <p>Anonymized case studies. Author-reported results.</p>
      </header>
      <div className="qp-evidence">
        <nav className="qp-case-list" aria-label="Case studies">
          {pilot.cases.map((entry, index) => (
            <button
              key={entry.id}
              aria-pressed={selected === index}
              onClick={() => setSelected(index)}
            >
              <small>{String(index + 1).padStart(2, '0')}</small>
              {entry.category}
            </button>
          ))}
        </nav>
        <article className="qp-case-detail qp-enter" key={item.id}>
          <span className="qp-label">{item.category}</span>
          <h2>{item.title}</h2>
          <div className="qp-outcomes" aria-label="Reported outcomes">
            <div>
              Original<b className="qp-bad">Fails</b>
            </div>
            <div>
              Patched<b className="qp-good">Passes</b>
            </div>
            <div>
              Fix removed<b className="qp-bad">Fails again</b>
            </div>
          </div>
          <dl className="qp-findings">
            <div>
              <dt>The bug</dt>
              <dd>{item.problem}</dd>
            </div>
            <div>
              <dt>The change</dt>
              <dd>{item.fix}</dd>
            </div>
          </dl>
          <details>
            <summary>What was checked</summary>
            <ul>
              {item.checks.map((check) => (
                <li key={check}>{check}</li>
              ))}
            </ul>
            <p>{item.mutation}</p>
          </details>
          <details>
            <summary>Scope & limitations</summary>
            <p>{item.boundary}</p>
            <p>
              These summaries are not independent certification or downloadable
              proof receipts. Private source and receipts are withheld.
            </p>
          </details>
          <div className="qp-details-links">
            <a href="/pilot-proof.json" download>
              Download summary ↓
            </a>
            <a href="https://github.com/aribradshaw/quorumpatch">
              Inspect public example ↗
            </a>
          </div>
        </article>
      </div>
    </ProductShell>
  );
}
