'use client';
import { useEffect, useRef, useState } from 'react';
import type Player from 'rrweb-player';
import Link from 'next/link';
import ProductShell from './product-shell';
import receipt from '../public/snapshot-results.json';
import 'rrweb-player/dist/style.css';
type ReplayEvents = ConstructorParameters<typeof Player>[0]['props']['events'];
type ManagedPlayer = Player & {
  $set(props: { width: number; height: number }): void;
  $destroy(): void;
};

const chapters = [
  {
    title: 'Original',
    heading: 'A retry sends A twice.',
    body: 'B rejects its first attempt. Retrying the batch repeats work that already succeeded.',
    stage: 'browser-original',
  },
  {
    title: 'Repair',
    heading: 'Only the failure is retried.',
    body: 'A fresh fork starts from the same snapshot. The candidate preserves A’s receipt and retries B.',
    stage: 'browser-candidate',
  },
  {
    title: 'Rewind',
    heading: 'Restore the machine. Restore the bug.',
    body: 'Solari rewinds the repaired machine. The original source and starting application state return, along with the duplicate send.',
    stage: 'browser-rewind',
  },
];
export default function SnapshotDemo({
  evidence = false,
}: {
  evidence?: boolean;
}) {
  const mount = useRef<HTMLDivElement>(null);
  const player = useRef<ManagedPlayer | null>(null);
  const [selected, setSelected] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [retry, setRetry] = useState(0);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    let stopped = false;
    let observer: ResizeObserver | undefined;
    const abort = new AbortController();
    setStatus('loading');
    Promise.all([
      import('rrweb-player'),
      fetch('/snapshot-replay.json', { signal: abort.signal }).then(
        async (r) => {
          if (!r.ok) throw Error('Replay unavailable');
          const data = await r.json();
          if (!Array.isArray(data)) throw Error('Invalid replay');
          return data as ReplayEvents;
        },
      ),
    ])
      .then(([{ default: Replay }, events]) => {
        if (stopped || !mount.current) return;
        const snapshots = events.filter(
          (event: { type: number; data: unknown }) =>
            event.type === 2 &&
            JSON.stringify(event.data).includes('Send once.'),
        );
        if (snapshots.length !== 3) throw Error('Unexpected replay chapters');
        const start = events.indexOf(snapshots[selected]);
        let end = events.findIndex(
          (event, index) => index > start && event.type === 4,
        );
        if (end < 0) end = events.length;
        const metadata = events
          .slice(0, start)
          .findLast((event) => event.type === 4);
        const clip = [
          ...(metadata ? [metadata] : []),
          ...events.slice(start, end),
        ];
        const viewport = metadata?.data as
          | { width?: number; height?: number }
          | undefined;
        const aspect = (viewport?.height || 720) / (viewport?.width || 1280);
        const width = mount.current.clientWidth;
        const instance = new Replay({
          target: mount.current,
          props: {
            events: clip,
            width,
            height: Math.round(width * aspect),
            autoPlay: false,
            skipInactive: true,
            showController: false,
            speedOption: [1, 2, 4],
            blockClass: 'rr-block',
          },
        }) as ManagedPlayer;
        player.current = instance;
        instance.goto(1, false);
        observer = new ResizeObserver(() => {
          if (!mount.current) return;
          const next = mount.current.clientWidth;
          instance.$set({ width: next, height: Math.round(next * aspect) });
          instance.triggerResize();
        });
        observer.observe(mount.current);
        setStatus('ready');
      })
      .catch(() => {
        if (!stopped) setStatus('error');
      });
    return () => {
      stopped = true;
      abort.abort();
      observer?.disconnect();
      player.current?.pause();
      player.current?.$destroy();
      player.current = null;
    };
  }, [retry, selected]);
  const chapter = chapters[selected];
  const run = receipt.stages.find((stage) => stage.name === chapter.stage);
  function select(index: number) {
    setSelected(index);
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText('npm run proof:snapshot:browser');
      setCopied('Copied.');
    } catch {
      setCopied('Select and copy the command above.');
    }
  }
  return (
    <ProductShell>
      <header className="qp-heading">
        <h1>
          {evidence ? 'The run behind the replay.' : 'Fix it. Then rewind it.'}
        </h1>
        <p>
          A recorded QuorumPatch experiment using Solari snapshots, forks and a
          real cloud browser.
        </p>
      </header>
      <section className="qp-workbench" aria-label="Snapshot experiment">
        <div className="qp-panel-bar">
          <span>RETRY LAB / SYNTHETIC CASE</span>
          <span>Recorded QuorumPatch run</span>
        </div>
        <div className="qp-snapshot-layout">
          <div className="qp-replay-column">
            <div
              className="qp-replay-host"
              ref={mount}
              aria-label="Sanitized browser session replay"
            />
            {status === 'loading' && (
              <div role="status" className="qp-replay-loading qp-skeleton">
                Loading recorded session…
              </div>
            )}
            {status === 'error' && (
              <div role="alert" className="qp-replay-loading">
                Replay unavailable.{' '}
                <button onClick={() => setRetry((v) => v + 1)}>
                  Try again
                </button>
              </div>
            )}
          </div>
          <article className="qp-stage-main">
            <div className="qp-chapters" aria-label="Replay chapters">
              {chapters.map((c, index) => (
                <button
                  key={c.title}
                  disabled={status !== 'ready'}
                  aria-pressed={selected === index}
                  onClick={() => select(index)}
                >
                  {c.title}
                </button>
              ))}
            </div>
            <h2>{chapter.heading}</h2>
            <p>{chapter.body}</p>
            <div className="qp-send-order">
              <span>Observed send order</span>
              <strong>{run?.observedSendOrder}</strong>
            </div>
            <button
              className="qp-primary"
              disabled={status !== 'ready'}
              onClick={() => {
                player.current?.goto(0, true);
              }}
            >
              Play this stage
            </button>
            <button
              className="qp-reset"
              disabled={status !== 'ready'}
              onClick={() => player.current?.pause()}
            >
              Pause replay
            </button>
          </article>
        </div>
      </section>
      <p className="qp-replay-note">
        Sanitized DOM replay, not a live run or video. Playback uses no Solari
        credits.
      </p>
      <section className="qp-reproduce">
        <div>
          <h2>Run it yourself.</h2>
          <p>
            Clone the repo, run npm ci, and set your SOLARI_API_KEY. Cloud
            execution uses your provider allowance.
          </p>
        </div>
        <div>
          <div className="qp-copy">
            <code>npm run proof:snapshot:browser</code>
            <button
              className="qp-icon"
              aria-label="Copy snapshot reproduction command"
              onClick={copy}
            >
              ⧉
            </button>
          </div>
          <p role="status">
            {copied || 'Node 22.13+. Only invented data enters the experiment.'}
          </p>
        </div>
      </section>
      <details open={evidence}>
        <summary>What the checks establish</summary>
        <p>
          The incomplete control passes the visible retry but fails an
          uncertain-response check. The candidate passes the frozen checks. A
          file written in one fork is absent from the next; rewind removes later
          changes. The provider key is absent from the tested guest command
          environment.
        </p>
        <p>
          This is sequential, synthetic and author-run. It is not a sandbox
          escape assessment, independent certification, or a guarantee of
          durable exactly-once delivery. API evidence is recorded;
          console-history attribution remains unresolved.
        </p>
        <div className="qp-proof-rows">
          {receipt.stages.map((stage) => (
            <div key={stage.name}>
              <span>{stage.name.replaceAll('-', ' ')}</span>
              <span>{stage.pass ? 'Confirmed' : 'Unconfirmed'}</span>
            </div>
          ))}
        </div>
        <p>
          All four sandboxes and the snapshot were released with API readback
          checks. Browser release and recording download also succeeded.
        </p>
      </details>
      <div className="qp-details-links">
        <a href="/snapshot-results.json" download>
          Run evidence ↓
        </a>
        <a href="/snapshot-replay.json" download>
          Sanitized replay ↓
        </a>
        <a href="/evidence-review.md">Method & limitations ↗</a>
        <Link href="/open-source">Three open-source cases ↗</Link>
        <Link href="/case-studies">Earlier case studies ↗</Link>
      </div>
    </ProductShell>
  );
}
