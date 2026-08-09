import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Slim top bar, mobile only (BottomNav owns the bottom edge and is
 * intentionally fixed at 5 nav items per PROJECT.md §3/§10 — this doesn't
 * touch that, it's just where the theme toggle lives on small screens).
 */
export function MobileHeader() {
  return (
    <header className="flex items-center justify-between border-b px-4 py-2 md:hidden">
      <span className="text-base font-semibold">Stay</span>
      <ThemeToggle />
    </header>
  );
}
