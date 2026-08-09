export type NavItem = {
  href: string;
  label: string;
};

// Mirrors the mobile bottom-nav from PROJECT.md §1/§3: Home, Rooms, + Booking, Guests, More.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home" },
  { href: "/rooms", label: "Rooms" },
  { href: "/bookings/new", label: "+ Booking" },
  { href: "/guests", label: "Guests" },
  { href: "/reports", label: "More" },
];
