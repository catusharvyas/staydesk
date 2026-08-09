import { redirect } from "next/navigation";
import { SideNav } from "@/components/nav/side-nav";
import { BottomNav } from "@/components/nav/bottom-nav";
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
      <main className="flex-1 overflow-x-hidden pb-16 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
