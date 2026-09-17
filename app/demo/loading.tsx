import '../experience.css';

export default function LoadingEvidence() {
  return (
    <main className="qp" aria-busy="true">
      <div className="qp-wrap" role="status" aria-label="Loading">
        <div aria-hidden="true">
          <div className="qp-skeleton qp-skeleton-title" />
          <div className="qp-skeleton qp-skeleton-panel" />
        </div>
      </div>
    </main>
  );
}
