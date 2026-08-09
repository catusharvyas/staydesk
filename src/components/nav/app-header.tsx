import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Top bar for the main content column — unlike SideNav (desktop-only) this
 * renders at every breakpoint, since it carries the one thing that needs to
 * be reachable from anywhere: the "+ Booking" shortcut, top-right (the
 * conventional spot for a primary create action — front-desk speed is the
 * whole point per PROJECT.md §1). "Stay" only shows here on mobile, since
 * SideNav already brands the desktop layout.
 */
export function AppHeader() {
  return (
    <header className="flex items-center border-b px-4 py-2">
      <span className="text-base font-semibold md:hidden">Stay</span>
      <div className="ml-auto flex items-center gap-2">
        <Link href="/bookings/new" className={buttonVariants({ size: "sm" })}>
          + Booking
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
