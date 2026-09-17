import '../marketing.css';

export default function LoadingEvidence() {
  return (
    <main className="marketing" aria-busy="true">
      <div className="mk-loading mk-wrap" role="status">
        <p>Loading QuorumPatch evidence…</p>
        <div aria-hidden="true">
          <span className="mk-skeleton mk-loading-title" />
          <span className="mk-skeleton mk-loading-line" />
          <span className="mk-skeleton mk-loading-panel" />
        </div>
      </div>
    </main>
  );
}
