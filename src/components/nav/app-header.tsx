import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { PropertyBrand } from "./property-brand";

/**
 * Top bar for the main content column — unlike SideNav (desktop-only) this
 * renders at every breakpoint, since it carries the one thing that needs to
 * be reachable from anywhere: the "+ Booking" shortcut, top-right (the
 * conventional spot for a primary create action — front-desk speed is the
 * whole point per PROJECT.md §1). The brand only shows here on mobile,
 * since SideNav already brands the desktop layout.
 */
export function AppHeader({
  logoUrl,
  propertyName,
}: {
  logoUrl: string | null;
  propertyName: string;
}) {
  return (
    <header className="flex items-center border-b px-4 py-2">
      <PropertyBrand
        logoUrl={logoUrl}
        propertyName={propertyName}
        className="md:hidden"
        logoClassName="h-7"
      />
      <div className="ml-auto flex items-center gap-2">
        <Link href="/bookings/new" className={buttonVariants({ size: "sm" })}>
          + Booking
        </Link>
        <ThemeToggle />
      </div>
    </header>
  );
}
