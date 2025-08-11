import { memo } from "react";

function RowSkeleton() {
  return <div className="skeleton sk-h-20 sk-w-full sk-mb-1" />;
}

function SuggestionRow({ text, onClick }) {
  return (
    <div
      className="px-3 py-2 hover-bg-light text-muted"
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      {text}
    </div>
  );
}

export default memo(function ReferenceSuggestions({
  open,
  loading,
  items,
  onPick,
}) {
  if (!open) return null;

  return (
    <div
      className="position-absolute bg-white border rounded shadow-sm mt-1 w-100 z-3"
      style={{ maxHeight: 220, overflowY: "auto" }}
    >
      {loading ? (
        <div className="p-2">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : items?.length ? (
        items.map((s, idx) => (
          <SuggestionRow
            key={`${s}-${idx}`}
            text={s}
            onClick={() => onPick(s)}
          />
        ))
      ) : (
        <div className="px-3 py-2 text-muted">No matches</div>
      )}
    </div>
  );
});
