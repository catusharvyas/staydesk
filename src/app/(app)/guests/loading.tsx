export default function Loading() {
  return (
    <div className="p-4 md:p-6">
      <div className="h-6 w-24 animate-pulse rounded bg-muted" />
      <div className="mt-4 flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 animate-pulse rounded-lg border bg-muted/50" />
        ))}
      </div>
    </div>
  );
}
