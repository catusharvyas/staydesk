"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";
import { PropertyBrand } from "./property-brand";

/**
 * Desktop/tablet nav — hidden below md, where BottomNav takes over.
 * ThemeToggle lives in AppHeader (not here) — one instance, visible at
 * every breakpoint, rather than duplicating it between the two nav shells.
 * The brand slot follows the same rule: shown here on desktop, and in
 * AppHeader on mobile, so exactly one is ever visible.
 */
export function SideNav({
  logoUrl,
  propertyName,
}: {
  logoUrl: string | null;
  propertyName: string;
}) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-1 border-r bg-sidebar p-4 md:flex">
      <div className="mb-6 px-2 pt-1">
        <PropertyBrand
          logoUrl={logoUrl}
          propertyName={propertyName}
          logoClassName="h-9"
          className="text-lg"
        />
      </div>
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-[18px]" strokeWidth={active ? 2.25 : 2} />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-auto truncate px-3 pb-1 text-xs text-muted-foreground">
        {propertyName}
      </div>
    </nav>
  );
}
