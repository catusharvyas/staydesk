export default function Loading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
