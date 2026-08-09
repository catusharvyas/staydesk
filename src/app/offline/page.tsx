export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-lg font-semibold">You&apos;re offline</h1>
      <p className="text-sm text-muted-foreground">
        This page hasn&apos;t been cached yet. Reconnect and try again — anything
        you already had open should still work from cache.
      </p>
    </main>
  );
}
