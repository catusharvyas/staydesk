export default function Loading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-6 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg border bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
