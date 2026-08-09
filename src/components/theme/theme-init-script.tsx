"use client";

import { useLayoutEffect } from "react";

// Follows this project's own Next.js docs guide verbatim
// (node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
// → "Themes" + "Re-applying attributes in development") rather than generic
// React knowledge — AGENTS.md flags this Next version as having real
// breaking changes from training data, and this one bit us: a plain
// next/script beforeInteractive + suppressHydrationWarning alone still
// re-triggered the mismatch, because dev-mode Strict Mode remounts <html>
// back to only its JSX-declared attributes, clearing the class the inline
// script set. The doc's fix is a useLayoutEffect that reapplies it — a
// no-op in production, where this remount doesn't happen.
//
// Uses a "dark" class (not the doc's data-theme attribute) because
// globals.css's `@custom-variant dark (&:is(.dark *))` — and every
// dark: utility already used in this app (e.g. rooms/page.tsx's
// STATUS_STYLES) — is keyed on that class, not an attribute.
const THEME_INIT = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored === "dark" || (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    if (dark) document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

/** Renders the raw inline script — belongs in <head>, runs during HTML parsing. */
export function ThemeInitScript() {
  return <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: THEME_INIT }} />;
}

/** Mount once in <body>. Reapplies the class after dev-mode's Strict Mode remount clears it. */
export function ThemeHydrationGuard() {
  useLayoutEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const dark =
        stored === "dark" ||
        (stored !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.classList.toggle("dark", dark);
    } catch {
      // localStorage unavailable — leave whatever the server rendered.
    }
  }, []);

  return null;
}
