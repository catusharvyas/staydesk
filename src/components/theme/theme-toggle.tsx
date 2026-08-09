"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Light/dark toggle. shadcn's `.dark` CSS-variable theme (globals.css) was
 * already fully scaffolded but never activated — this is the only piece
 * that was missing. Class is applied directly to <html> and persisted to
 * localStorage; theme-init-script.tsx runs before hydration so there's no
 * flash of the wrong theme on load.
 *
 * Uses useSyncExternalStore rather than useState+useEffect, same reasoning
 * as ConnectivityBanner (see PROJECT.md §9's hydration-bug writeup) — the
 * real value lives outside React (the DOM class / localStorage), and this
 * hook is the correct way to read browser-only state without a
 * server/client mismatch or a setState-in-effect lint violation.
 */
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerSnapshot() {
  return false;
}

function setTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
  listeners.forEach((listener) => listener());
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(!getSnapshot())}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  );
}
