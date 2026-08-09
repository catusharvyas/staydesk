import { redirect } from "next/navigation";
import { SideNav } from "@/components/nav/side-nav";
import { BottomNav } from "@/components/nav/bottom-nav";
import { AppHeader } from "@/components/nav/app-header";
import { getCurrentProperty } from "@/lib/property";

/**
 * Shared shell for every operational module (Dashboard, Rooms, Bookings,
 * Guests, Reports). Side nav on desktop/tablet, persistent bottom nav on
 * mobile — see PROJECT.md §3.
 *
 * proxy.ts already guarantees an authenticated user gets here; this layout
 * additionally guarantees they have a property, sending first-time users to
 * onboarding instead of every page re-deriving that check.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  return (
    <div className="flex min-h-dvh flex-1">
      <SideNav />
      <div className="flex flex-1 flex-col overflow-x-hidden">
        <AppHeader />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
