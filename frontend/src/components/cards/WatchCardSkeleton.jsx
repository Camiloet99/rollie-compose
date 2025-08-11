import Skeleton from "@/components/ui/Skeleton";

export default function WatchCardSkeleton() {
  return (
    <div
      className="watch-card-skeleton"
      style={{ padding: 12, border: "1px solid #eee", borderRadius: 12 }}
    >
      <Skeleton className="sk-w-full sk-h-40 sk-mb-3" />
      <Skeleton className="sk-w-2_3 sk-h-24 sk-mb-2" />
      <Skeleton className="sk-w-1_2 sk-h-24 sk-mb-2" />
      <div style={{ display: "flex", gap: 8 }}>
        <Skeleton className="sk-w-24 sk-h-24" />
        <Skeleton className="sk-w-36 sk-h-24" />
      </div>
    </div>
  );
}
