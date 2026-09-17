'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Moon, Sun } from 'lucide-react';
import './experience.css';
export default function ProductShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);
  return (
    <main className={`qp ${dark ? 'qp-dark' : ''}`}>
      <header className="qp-nav qp-wrap">
        <Link href="/" className="qp-brand">
          <span className="brand-mark" aria-hidden="true" />
          QuorumPatch
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/walkthrough">Demo</Link>
          <Link href="/demo">Evidence</Link>
          <button
            className="qp-icon"
            onClick={() => setDark((v) => !v)}
            aria-label="Toggle dark mode"
            aria-pressed={dark}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </nav>
      </header>
      <div className="qp-wrap qp-content">{children}</div>
      <footer className="qp-footer qp-wrap">
        <span>QuorumPatch / Built with Solari</span>
        <a href="https://github.com/aribradshaw/quorumpatch">GitHub ↗</a>
      </footer>
    </main>
  );
}
