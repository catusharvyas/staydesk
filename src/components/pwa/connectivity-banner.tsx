"use client";

import { useSyncExternalStore } from "react";

// useSyncExternalStore is the idiomatic tool for browser-only external state
// like navigator.onLine — unlike a lazy useState initializer, its
// getServerSnapshot/getSnapshot split is explicitly designed so SSR and the
// client are allowed to disagree without producing a hydration mismatch.
// (An earlier version of this component used a lazy initializer guarded by
// `typeof navigator !== "undefined"` and hit a real hydration bug: Node's
// SSR runtime has a `navigator` global with no `onLine` property, so
// `!navigator.onLine` silently evaluated to `true` — offline — on the
// server while the browser correctly evaluated `false`. Caught via a
// fresh-tab reproduction, not a lint warning.)
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}
function getSnapshot() {
  return navigator.onLine;
}
function getServerSnapshot() {
  return true; // assume online for SSR; corrected client-side immediately after hydration
}

/**
 * V1 offline scope (revised from the original "queue and sync" plan — see
 * PROJECT.md §5/§9): writes fail normally when offline rather than being
 * silently queued. This banner is what makes that safe — front-desk staff
 * need to *know* they've lost connectivity before an action fails, not
 * discover it after clicking "Check Out" and wondering why nothing happened.
 *
 * Deliberately just online/offline, no transient "reconnected" message — an
 * earlier version had one with a 3s auto-hide timer that had a real bug
 * (never actually hid), and that nicety isn't worth the complexity or
 * further debugging time next to the safety-critical offline warning.
 */
export function ConnectivityBanner() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="w-full text-center text-sm font-medium"
      // Inline styles, deliberately, for color/background/padding: this
      // project's dev environment (Next 16 Turbopack + Tailwind v4) was
      // caught serving genuinely stale JavaScript for classes/logic first
      // introduced by this component — traced to our own service worker
      // cache-first'ing /_next/static/* in dev, where Turbopack doesn't
      // guarantee immutable chunk filenames the way a production build
      // does (see PROJECT.md §9 for the full repro). Fixed at the source by
      // gating SW registration to production only (register-sw.tsx). These
      // inline styles were the diagnostic fix applied *before* that root
      // cause was found; kept afterward since they guarantee this banner
      // is never invisible regardless of any future dev-toolchain quirk —
      // too important to leave fragile on a Tailwind cache technicality.
      style={{ padding: "8px 16px", color: "#ffffff", backgroundColor: "#dc2626" }}
    >
      You&apos;re offline — actions won&apos;t save until you reconnect.
    </div>
  );
}
