export default function Loading() {
  return (
    <div className="p-4 md:p-8">
      <div className="h-8 w-44 animate-pulse rounded-lg bg-muted" />
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-card shadow-sm ring-1 ring-foreground/8" />
        ))}
      </div>
    </div>
  );
}
