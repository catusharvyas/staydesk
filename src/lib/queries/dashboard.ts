import { createClient } from "@/lib/supabase/server";

export type DashboardStats = {
  occupied: number;
  available: number;
  arrivals: number;
  departures: number;
};

const ACTIVE_STATUSES = ["reserved", "checked_in"] as const;

export async function getDashboardStats(propertyId: string): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [occupied, available, arrivals, departures] = await Promise.all([
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .eq("status", "occupied"),
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .eq("status", "available"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .eq("check_in_planned", today)
      .in("status", ACTIVE_STATUSES),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .eq("check_out_planned", today)
      .in("status", ACTIVE_STATUSES),
  ]);

  return {
    occupied: occupied.count ?? 0,
    available: available.count ?? 0,
    arrivals: arrivals.count ?? 0,
    departures: departures.count ?? 0,
  };
}

export type DayOccupancy = {
  /** ISO date, "YYYY-MM-DD". */
  date: string;
  occupied: number;
  totalRooms: number;
};

/**
 * Per-day occupancy for one calendar month, for the dashboard's month view.
 *
 * "Occupied that day" means any booking whose stay_range contains the day
 * and whose status isn't 'cancelled' — deliberately wider than the
 * ACTIVE_STATUSES set used elsewhere. ACTIVE_STATUSES (reserved,
 * checked_in) is a "does this currently block the room" filter, which is
 * right for today's live stats but wrong here: a past day in the same
 * month can contain bookings that have since moved to 'checked_out', and
 * those bookings genuinely did occupy the room that day. Only 'cancelled'
 * never did.
 *
 * stay_range is a stored `daterange(check_in_planned, check_out_planned, '[)')`
 * (0001_init.sql) — half-open, so a checkout day itself is NOT occupied,
 * matching how the room actually turns over.
 *
 * Fetches once (all bookings overlapping the month) and buckets client-side
 * rather than one query per day — a property's monthly booking count is
 * small, and this keeps it to a single round trip.
 */
export async function getMonthOccupancy(
  propertyId: string,
  year: number,
  /** 1-indexed month (1 = January), matching how callers naturally think about months. */
  month: number
): Promise<DayOccupancy[]> {
  const supabase = await createClient();

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEndExclusive = new Date(Date.UTC(year, month, 1));
  const daysInMonth = Math.round(
    (monthEndExclusive.getTime() - monthStart.getTime()) / 86_400_000
  );
  const toISODate = (d: Date) => d.toISOString().slice(0, 10);

  const [{ count: totalRooms }, { data: bookings, error }] = await Promise.all([
    supabase
      .from("rooms")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId),
    supabase
      .from("bookings")
      .select("check_in_planned, check_out_planned")
      .eq("property_id", propertyId)
      .neq("status", "cancelled")
      .lt("check_in_planned", toISODate(monthEndExclusive))
      .gt("check_out_planned", toISODate(monthStart)),
  ]);

  if (error) throw error;

  const days: DayOccupancy[] = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(monthStart);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: toISODate(d), occupied: 0, totalRooms: totalRooms ?? 0 };
  });

  for (const b of bookings ?? []) {
    // Half-open [check_in, check_out) — the checkout day itself doesn't count.
    for (const day of days) {
      if (day.date >= b.check_in_planned && day.date < b.check_out_planned) {
        day.occupied += 1;
      }
    }
  }

  return days;
}

export async function listTodayArrivals(propertyId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("bookings")
    .select("id, check_in_planned, rooms(number), guests(name)")
    .eq("property_id", propertyId)
    .eq("check_in_planned", today)
    .in("status", ACTIVE_STATUSES)
    .order("check_in_planned");

  if (error) throw error;
  return data;
}
