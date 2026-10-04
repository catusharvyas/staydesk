import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <WifiOff className="size-6" />
      </span>
      <h1 className="text-xl font-semibold tracking-tight">You&apos;re offline</h1>
      <p className="max-w-xs text-sm text-muted-foreground">
        This page hasn&apos;t been cached yet. Reconnect and try again — anything
        you already had open should still work from cache.
      </p>
    </main>
  );
}
