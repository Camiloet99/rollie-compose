export default function WatchCardSkeleton() {
  return (
    <div
      className="mb-3 shadow-sm border-0 rounded-4 p-3"
      style={{ background: "#ffffff" }}
    >
      <div className="skeleton sk-h-20 sk-w-40 sk-mb-2" />
      <div className="skeleton sk-h-14 sk-w-60 sk-mb-1" />
      <div className="skeleton sk-h-14 sk-w-48 sk-mb-2" />
      <div className="d-flex gap-2 sk-mb-2">
        <div className="skeleton sk-h-20 sk-w-24" />
        <div className="skeleton sk-h-20 sk-w-20" />
        <div className="skeleton sk-h-20 sk-w-16" />
      </div>
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex flex-column" style={{ gap: 8 }}>
          <div className="skeleton sk-h-20 sk-w-40" />
          <div className="skeleton sk-h-14 sk-w-24" />
        </div>
        <div style={{ width: 180 }}>
          <div className="skeleton sk-h-28 sk-w-full sk-mb-1" />
          <div className="skeleton sk-h-28 sk-w-full" />
        </div>
      </div>
    </div>
  );
}
