"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * Desktop/tablet nav — hidden below md, where BottomNav takes over.
 * ThemeToggle lives in AppHeader (not here) — one instance, visible at
 * every breakpoint, rather than duplicating it between the two nav shells.
 */
export function SideNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex w-56 shrink-0 flex-col gap-1 border-r p-4">
      <div className="mb-4 px-2 text-lg font-semibold">Stay</div>
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-2 py-1.5 text-sm ${
              active
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
