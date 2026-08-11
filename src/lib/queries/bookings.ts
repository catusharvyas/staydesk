import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATUSES = ["reserved", "checked_in"] as const;

export async function listBookings(propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, rooms(number), guests(name, phone)")
    .eq("property_id", propertyId)
    .order("check_in_planned", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBookingWithDetails(propertyId: string, bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, rooms(number), guests(name, phone)")
    .eq("property_id", propertyId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** The active (reserved/checked_in) booking for a room, if any — drives the
 * room detail page's Extend Stay / Check Out actions. */
export async function getActiveBookingForRoom(propertyId: string, roomId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*, guests(name, phone)")
    .eq("property_id", propertyId)
    .eq("room_id", roomId)
    .in("status", ACTIVE_STATUSES)
    .order("check_in_planned", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function listGuests(propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("id, name, phone")
    .eq("property_id", propertyId)
    .order("name");

  if (error) throw error;
  return data;
}

/**
 * Rooms with no active (reserved/checked_in) booking overlapping the given
 * date range — mirrors the DB exclusion constraint (0001_init.sql) so the
 * UI only offers rooms that will actually pass it. This is a UX filter, not
 * the source of truth: the constraint is what actually prevents a
 * double-booking if two people submit at once.
 *
 * `excludeBookingId` is for editing an existing reserved booking's room —
 * without it, the booking's own current room would show as "conflicting"
 * with itself (its own stay_range overlaps its own dates).
 */
export async function listAvailableRooms(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  excludeBookingId?: string
) {
  const supabase = await createClient();

  let conflictsQuery = supabase
    .from("bookings")
    .select("room_id")
    .eq("property_id", propertyId)
    .in("status", ACTIVE_STATUSES)
    .lt("check_in_planned", checkOut)
    .gt("check_out_planned", checkIn);
  if (excludeBookingId) {
    conflictsQuery = conflictsQuery.neq("id", excludeBookingId);
  }

  const [{ data: rooms, error: roomsError }, { data: conflicts, error: conflictsError }] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("id, number, room_types(name)")
        .eq("property_id", propertyId)
        .order("number"),
      conflictsQuery,
    ]);

  if (roomsError) throw roomsError;
  if (conflictsError) throw conflictsError;

  const bookedRoomIds = new Set((conflicts ?? []).map((b) => b.room_id));
  return (rooms ?? []).filter((r) => !bookedRoomIds.has(r.id));
}
