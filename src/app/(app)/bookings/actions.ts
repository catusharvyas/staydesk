"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";
import { generateInvoiceForBooking } from "@/lib/invoicing";
import type { Enums } from "@/lib/supabase/database.types";

type RoomStatus = Enums<"room_status">;

export type BookingActionState = { error: string | null };

const PATHS_TO_REVALIDATE = ["/bookings", "/rooms", "/dashboard"];

function revalidateAll() {
  for (const path of PATHS_TO_REVALIDATE) revalidatePath(path);
}

// Postgres exclusion-constraint violation — the DB-level double-booking
// guard (0001_init.sql). Surface it as a normal validation message instead
// of a raw Postgres error.
function isOverlapViolation(error: { code?: string; message?: string }) {
  return error.code === "23P01" || error.message?.includes("no_overlapping_bookings");
}

export async function createBooking(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const roomId = String(formData.get("roomId") ?? "");
  const checkInPlanned = String(formData.get("checkInPlanned") ?? "");
  const checkOutPlanned = String(formData.get("checkOutPlanned") ?? "");
  const rawGuestId = String(formData.get("guestId") ?? "");
  const guestId = rawGuestId === "__new__" ? "" : rawGuestId;
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestPhone = String(formData.get("guestPhone") ?? "").trim();

  if (!roomId || !checkInPlanned || !checkOutPlanned) {
    return { error: "Room and dates are required." };
  }
  if (checkOutPlanned <= checkInPlanned) {
    return { error: "Check-out must be after check-in." };
  }
  if (!guestId && !guestName) {
    return { error: "Select a guest or enter a name for a new one." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let resolvedGuestId = guestId;
  if (!resolvedGuestId) {
    const { data: guest, error: guestError } = await supabase
      .from("guests")
      .insert({ property_id: property.id, name: guestName, phone: guestPhone || null })
      .select("id")
      .single();
    if (guestError) return { error: guestError.message };
    resolvedGuestId = guest.id;
  }

  const { error: bookingError } = await supabase.from("bookings").insert({
    property_id: property.id,
    guest_id: resolvedGuestId,
    room_id: roomId,
    check_in_planned: checkInPlanned,
    check_out_planned: checkOutPlanned,
    status: "reserved",
    created_by: user?.id ?? null,
  });

  if (bookingError) {
    if (isOverlapViolation(bookingError)) {
      return { error: "That room is already booked for those dates." };
    }
    return { error: bookingError.message };
  }

  // Only flip the room board to "reserved" for arrivals starting today —
  // matches the mockup (a room reserved for next month shouldn't visually
  // block today's view). Bookings/Dashboard still show future reservations
  // correctly regardless; this only affects the room-board badge color.
  const today = new Date().toISOString().slice(0, 10);
  if (checkInPlanned === today) {
    await supabase
      .from("rooms")
      .update({ status: "reserved" })
      .eq("id", roomId)
      .eq("status", "available");
  }

  revalidateAll();
  redirect("/bookings");
}

async function logRoomStatus(
  roomId: string,
  fromStatus: RoomStatus | null,
  toStatus: RoomStatus,
  userId: string | null
) {
  const supabase = await createClient();
  await supabase
    .from("room_status_log")
    .insert({ room_id: roomId, from_status: fromStatus, to_status: toStatus, changed_by: userId });
}

export async function checkInBooking(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, room_id, status")
    .eq("id", bookingId)
    .eq("property_id", property.id)
    .maybeSingle();
  if (fetchError || !booking) return { error: fetchError?.message ?? "Booking not found." };
  if (booking.status !== "reserved") return { error: "Only reserved bookings can be checked in." };

  const { data: room } = await supabase
    .from("rooms")
    .select("status")
    .eq("id", booking.room_id)
    .maybeSingle();

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "checked_in", check_in_actual: new Date().toISOString() })
    .eq("id", bookingId);
  if (updateError) return { error: updateError.message };

  await supabase.from("rooms").update({ status: "occupied" }).eq("id", booking.room_id);
  await logRoomStatus(booking.room_id, room?.status ?? null, "occupied", user?.id ?? null);

  revalidateAll();
  return { error: null };
}

export async function checkOutBooking(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, room_id, status")
    .eq("id", bookingId)
    .eq("property_id", property.id)
    .maybeSingle();
  if (fetchError || !booking) return { error: fetchError?.message ?? "Booking not found." };
  if (booking.status !== "checked_in") return { error: "Only checked-in bookings can be checked out." };

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "checked_out", check_out_actual: new Date().toISOString() })
    .eq("id", bookingId);
  if (updateError) return { error: updateError.message };

  // Room workflow (PROJECT.md §1): a checked-out room goes to Cleaning, not
  // straight back to Available — housekeeping must explicitly release it.
  await supabase.from("rooms").update({ status: "cleaning" }).eq("id", booking.room_id);
  await logRoomStatus(booking.room_id, "occupied", "cleaning", user?.id ?? null);

  // Best-effort: a failed invoice shouldn't block checkout (the guest still
  // needs their room released). Retryable manually via generateInvoice on
  // the invoice page if this fails.
  const invoiceResult = await generateInvoiceForBooking(property.id, bookingId);
  if (invoiceResult.error) {
    console.error("Invoice generation failed for booking", bookingId, invoiceResult.error);
  }

  revalidateAll();
  return { error: null };
}

export async function cancelBooking(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const supabase = await createClient();

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, room_id, status, check_in_planned")
    .eq("id", bookingId)
    .eq("property_id", property.id)
    .maybeSingle();
  if (fetchError || !booking) return { error: fetchError?.message ?? "Booking not found." };
  if (booking.status !== "reserved") {
    return { error: "Only reserved (not yet checked-in) bookings can be cancelled." };
  }

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId);
  if (updateError) return { error: updateError.message };

  const today = new Date().toISOString().slice(0, 10);
  if (booking.check_in_planned === today) {
    await supabase
      .from("rooms")
      .update({ status: "available" })
      .eq("id", booking.room_id)
      .eq("status", "reserved");
  }

  revalidateAll();
  return { error: null };
}

export async function extendStay(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const newCheckOut = String(formData.get("checkOutPlanned") ?? "");
  if (!newCheckOut) return { error: "New check-out date is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ check_out_planned: newCheckOut })
    .eq("id", bookingId)
    .eq("property_id", property.id);

  if (error) {
    if (isOverlapViolation(error)) {
      return { error: "That room is already booked on some of those extra nights." };
    }
    return { error: error.message };
  }

  revalidateAll();
  return { error: null };
}
