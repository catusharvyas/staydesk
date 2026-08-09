"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";

export type RoomActionState = { error: string | null };

// RLS (rooms_insert / room_types_write) restricts these to owner/admin —
// front_desk/housekeeping can change room *status* but not the room master.
export async function createRoomType(
  _prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const name = String(formData.get("name") ?? "").trim();
  const baseRate = Number(formData.get("baseRate"));
  if (!name || !Number.isFinite(baseRate) || baseRate <= 0) {
    return { error: "Enter a valid name and base rate." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("room_types").insert({
    property_id: property.id,
    name,
    base_rate: baseRate,
  });
  if (error) return { error: error.message };

  revalidatePath("/rooms");
  return { error: null };
}

export async function createRoom(
  _prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const number = String(formData.get("number") ?? "").trim();
  const floor = String(formData.get("floor") ?? "").trim();
  const roomTypeId = String(formData.get("roomTypeId") ?? "");
  if (!number || !roomTypeId) {
    return { error: "Room number and type are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("rooms").insert({
    property_id: property.id,
    room_type_id: roomTypeId,
    number,
    floor: floor || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  return { error: null };
}

// rooms_update RLS (0002_rls.sql) intentionally allows any property member
// to update a room, since front_desk/housekeeping need to change *status*.
// Editing the room master (number/floor/type) is owner/admin only, same as
// create/delete — enforced here at the app level, matching the pattern
// already used for the checkout/release workflow guards (PROJECT.md §10).
export async function updateRoom(
  _prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };
  if (property.role !== "owner" && property.role !== "admin") {
    return { error: "Only owner/admin can edit rooms." };
  }

  const roomId = String(formData.get("roomId") ?? "");
  const number = String(formData.get("number") ?? "").trim();
  const floor = String(formData.get("floor") ?? "").trim();
  const roomTypeId = String(formData.get("roomTypeId") ?? "");
  if (!roomId || !number || !roomTypeId) {
    return { error: "Room number and type are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("rooms")
    .update({ number, floor: floor || null, room_type_id: roomTypeId })
    .eq("id", roomId)
    .eq("property_id", property.id);
  if (error) return { error: error.message };

  revalidatePath("/rooms");
  revalidatePath(`/rooms/${roomId}`);
  return { error: null };
}

// Room workflow (PROJECT.md §1): Occupied -> Checkout -> Cleaning ->
// Available. This is the explicit housekeeping release step — a checked-out
// room never flips to Available on its own. Any property member can do
// this (front_desk/housekeeping need to, not just owner/admin).
export async function releaseRoom(
  _prevState: RoomActionState,
  formData: FormData
): Promise<RoomActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const roomId = String(formData.get("roomId") ?? "");
  if (!roomId) return { error: "Missing room." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: room, error } = await supabase
    .from("rooms")
    .update({ status: "available" })
    .eq("id", roomId)
    .eq("property_id", property.id)
    .eq("status", "cleaning")
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message };
  if (!room) return { error: "Room isn't awaiting cleaning release." };

  await supabase
    .from("room_status_log")
    .insert({ room_id: roomId, from_status: "cleaning", to_status: "available", changed_by: user?.id ?? null });

  revalidatePath("/rooms");
  revalidatePath("/dashboard");
  return { error: null };
}
