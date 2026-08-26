import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DayOccupancy } from "@/lib/queries/dashboard";
import { OCCUPANCY_BUCKETS, bucketForOccupancy } from "@/lib/occupancy-buckets";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Server Component — this is a plain grid, not a widget, so it needs no
 * client-side state. Month navigation is just links to ?y=&m=, matching
 * how the rest of the app avoids client components where a server
 * re-render does the job (see dashboard/page.tsx for the tab links this
 * pairs with).
 */
export function MonthCalendar({
  year,
  month,
  days,
}: {
  year: number;
  /** 1-indexed, matching getMonthOccupancy. */
  month: number;
  days: DayOccupancy[];
}) {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0=Sun
  const leadingBlanks = Array.from({ length: firstDow }, (_, i) => i);

  const today = new Date().toISOString().slice(0, 10);
  const monthLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const prev = month === 1 ? { y: year - 1, m: 12 } : { y: year, m: month - 1 };
  const next = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const linkFor = (y: number, m: number) => `/dashboard?tab=month&y=${y}&m=${m}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium">{monthLabel}</h2>
        <div className="flex gap-1">
          <Link href={linkFor(prev.y, prev.m)}>
            <Button type="button" variant="ghost" size="icon" aria-label="Previous month">
              <ChevronLeft className="size-4" />
            </Button>
          </Link>
          <Link href={linkFor(next.y, next.m)}>
            <Button type="button" variant="ghost" size="icon" aria-label="Next month">
              <ChevronRight className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {leadingBlanks.map((i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const bucket = bucketForOccupancy(day.occupied, day.totalRooms);
          const isToday = day.date === today;
          return (
            <div
              key={day.date}
              className={`flex aspect-square flex-col items-center justify-center rounded-md ${bucket.bgClass} ${bucket.fgClass} ${
                isToday ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""
              }`}
              title={`${day.date}: ${day.occupied}/${day.totalRooms} rooms occupied`}
            >
              <span className="text-sm font-medium">{Number(day.date.slice(-2))}</span>
              <span className="text-[10px] opacity-90">
                {day.occupied}/{day.totalRooms}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OccupancyLegend() {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
      <span className="font-medium text-foreground">Occupancy:</span>
      {OCCUPANCY_BUCKETS.map((b) => (
        <span key={b.key} className="flex items-center gap-1.5">
          <span className={`size-3 rounded-sm ${b.bgClass}`} aria-hidden />
          {b.label}
        </span>
      ))}
    </div>
  );
}
