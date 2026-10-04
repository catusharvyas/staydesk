import { cn } from "@/lib/utils";

/**
 * One heading treatment for every module page, so titles, subtitles and the
 * primary action sit in the same place everywhere. `action` is the page's
 * single main call-to-action, right-aligned.
 */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

/** Small uppercase label that introduces a block of content on a page. */
export function SectionTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
        className
      )}
    >
      {children}
    </h2>
  );
}
