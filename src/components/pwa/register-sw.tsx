"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on mount. Renders nothing.
 *
 * Production only, deliberately. Next.js's static chunk filenames are
 * content-hashed and truly immutable in a production build, which is what
 * makes the SW's cache-first strategy for /_next/static/* safe. In dev,
 * Turbopack doesn't give the same guarantee across every recompile, and a
 * registered SW caching dev chunks cache-first produces genuinely stale
 * JavaScript that survives file edits, full dev-server restarts, and even
 * fresh browser tabs — a real bug hunted for an embarrassingly long time
 * during Phase 8 before the actual cause (stale SW cache, not a Tailwind or
 * hydration issue at all) was found. If you need to test SW/offline
 * behavior locally, use `next build && next start` instead of `next dev`.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.error("Service worker registration failed", err);
      });
    }
  }, []);

  return null;
}
