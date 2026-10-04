export default function Loading() {
  return (
    <div className="p-4 md:p-8">
      <div className="h-8 w-44 animate-pulse rounded-lg bg-muted" />
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-card shadow-sm ring-1 ring-foreground/8" />
        ))}
      </div>
    </div>
  );
}
