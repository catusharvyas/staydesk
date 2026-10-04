import { cn } from "@/lib/utils";

/**
 * The brand slot shared by both nav shells — SideNav on desktop, AppHeader
 * on mobile. Renders the property's uploaded logo when there is one, and
 * falls back to the "Stay" wordmark when there isn't, so a property that
 * never uploads anything looks exactly as it did before.
 *
 * Kept as one component rather than duplicated into the two navs so the
 * fallback rule and the sizing constraints only exist in one place.
 */
export function PropertyBrand({
  logoUrl,
  propertyName,
  className = "",
  logoClassName = "h-8",
}: {
  logoUrl: string | null;
  propertyName: string;
  className?: string;
  logoClassName?: string;
}) {
  // cn(), not template interpolation — callers override the text size
  // ("text-lg" from SideNav), and two competing Tailwind size classes in one
  // string resolve by stylesheet order, not by which was passed last.
  if (!logoUrl) {
    return (
      <span className={cn("flex items-center gap-2 text-base font-semibold tracking-tight", className)}>
        <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          S
        </span>
        Stay
      </span>
    );
  }

  return (
    // Plain <img>, not next/image: this is a user-uploaded Supabase Storage
    // URL, which would otherwise need a remotePatterns entry, and it buys
    // nothing for a small logo.
    //
    // `object-left` matters — `object-contain` alone centres the image inside
    // the element box once max-width constrains it, which is exactly the bug
    // that made the PDF logo render indented (see PROJECT.md §10 "Brand logo").
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoUrl}
      alt={propertyName}
      className={cn("w-auto max-w-[160px] object-contain object-left", logoClassName, className)}
    />
  );
}
