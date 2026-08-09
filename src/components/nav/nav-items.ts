export type NavItem = {
  href: string;
  label: string;
};

// Mirrors the mobile bottom-nav from PROJECT.md §1/§3: Home, Rooms, Bookings, Guests, More.
// The quick-create shortcut formerly here ("+ Booking") moved to AppHeader
// (top-right, reachable from every page) once this slot pointed at the
// list instead — see PROJECT.md's nav changelog entry for why.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/bookings", label: "Bookings" },
  { href: "/guests", label: "Guests" },
  { href: "/reports", label: "More" },
];
