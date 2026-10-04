import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** The standard raised panel: white card, hairline ring, soft shadow. */
export function Surface({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-xl bg-card shadow-sm ring-1 ring-foreground/8", className)}
      {...props}
    />
  );
}

/** Same panel as a divided list container (`<ul>`). */
export function SurfaceList({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      className={cn(
        "divide-y divide-border overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/8",
        className
      )}
      {...props}
    />
  );
}

export type Tone = "primary" | "green" | "amber" | "blue" | "red" | "slate";

/** Soft tinted chip backgrounds for icons and badges, light + dark safe. */
export const TONE_CLASSES: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary",
  green: "bg-green-500/12 text-green-700 dark:text-green-400",
  amber: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  blue: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  red: "bg-red-500/12 text-red-700 dark:text-red-400",
  slate: "bg-slate-500/12 text-slate-600 dark:text-slate-400",
};

/** Headline number with a label and an icon chip — dashboard & reports. */
export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Surface className={cn("flex items-center gap-3 p-4", className)}>
      {Icon && (
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            TONE_CLASSES[tone]
          )}
        >
          <Icon className="size-5" />
        </span>
      )}
      <div className="min-w-0">
        <div className="truncate text-2xl font-semibold leading-none tracking-tight tabular-nums">
          {value}
        </div>
        <div className="mt-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      </div>
    </Surface>
  );
}

/** Friendly placeholder for lists with nothing in them yet. */
export function EmptyState({
  icon: Icon,
  title,
  hint,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border border-dashed bg-card/50 px-4 py-10 text-center",
        className
      )}
    >
      {Icon && (
        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="size-5" />
        </span>
      )}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
