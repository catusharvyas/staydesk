"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * Persistent bottom nav for mobile — per PROJECT.md §3, the mobile
 * experience should not shrink the desktop grid; this is its own layout.
 * Hidden at md+ where the side nav takes over.
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex border-t bg-card/90 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] ${
              active ? "font-semibold text-primary" : "text-muted-foreground"
            }`}
          >
            <span
              className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                active ? "bg-primary/12" : ""
              }`}
            >
              <Icon className="size-5" strokeWidth={active ? 2.25 : 2} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
