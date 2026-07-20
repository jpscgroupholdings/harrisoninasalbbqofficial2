export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-stone-100 animate-pulse">
      <div className="h-4 w-24 bg-stone-100 rounded mb-3" />
      <div className="h-7 w-16 bg-stone-100 rounded mb-3" />
      <div className="h-4 w-32 bg-stone-100 rounded" />
    </div>
  );
}