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
