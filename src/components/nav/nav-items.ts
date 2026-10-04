import {
  BedDouble,
  CalendarCheck,
  LayoutDashboard,
  Users,
  BarChart3,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// Mirrors the mobile bottom-nav from PROJECT.md §1/§3: Home, Rooms, Bookings, Guests, More.
// The quick-create shortcut formerly here ("+ Booking") moved to AppHeader
// (top-right, reachable from every page) once this slot pointed at the
// list instead — see PROJECT.md's nav changelog entry for why.
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/rooms", label: "Rooms", icon: BedDouble },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/guests", label: "Guests", icon: Users },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];
