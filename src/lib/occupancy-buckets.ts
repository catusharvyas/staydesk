/**
 * Density buckets for the month-occupancy calendar (dashboard). Shared by
 * the calendar cells and the legend so they can never drift apart.
 *
 * Kept as one fixed sequential ramp, deliberately independent of the
 * per-property accent theme (src/lib/theme-presets.ts): if a hotel's brand
 * happens to be violet, "busy" still means the same colour it does for a
 * blue-branded property. Data colour shouldn't move when branding moves.
 * It's also independent of the room board's green/blue/amber/red status
 * colours, which are semantic states, not a density gradient — this ramp
 * uses its own hue (teal) so "100% booked" is never visually confused with
 * "occupied right now" on the room board.
 *
 * Bucket boundaries are stated explicitly (not just five shades of a
 * gradient) because that's what makes a legend actually informative, per
 * the plan discussed with the user.
 */

export type OccupancyBucket = {
  key: "empty" | "low" | "mid" | "high" | "full";
  label: string;
  /** Tailwind class pulling the corresponding --chart-N token (globals.css). */
  bgClass: string;
  /** Text stays readable against bgClass in both light and dark mode — see globals.css comment on the chart-* ramp. */
  fgClass: string;
};

export const OCCUPANCY_BUCKETS: OccupancyBucket[] = [
  { key: "empty", label: "0%", bgClass: "bg-chart-1", fgClass: "text-foreground" },
  { key: "low", label: "1–40%", bgClass: "bg-chart-2", fgClass: "text-white" },
  { key: "mid", label: "41–70%", bgClass: "bg-chart-3", fgClass: "text-white" },
  { key: "high", label: "71–99%", bgClass: "bg-chart-4", fgClass: "text-white" },
  { key: "full", label: "100%", bgClass: "bg-chart-5", fgClass: "text-white" },
];

/** occupied/total -> which bucket's colour a calendar day should show. */
export function bucketForOccupancy(occupied: number, totalRooms: number): OccupancyBucket {
  if (totalRooms <= 0 || occupied <= 0) return OCCUPANCY_BUCKETS[0];
  const pct = (occupied / totalRooms) * 100;
  if (pct >= 100) return OCCUPANCY_BUCKETS[4];
  if (pct > 70) return OCCUPANCY_BUCKETS[3];
  if (pct > 40) return OCCUPANCY_BUCKETS[2];
  return OCCUPANCY_BUCKETS[1];
}
