"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";

export type GuestActionState = { error: string | null };

function fieldsFromForm(formData: FormData) {
  return {
    name: String(formData.get("name") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    id_proof_type: String(formData.get("idProofType") ?? "").trim() || null,
    id_proof_number: String(formData.get("idProofNumber") ?? "").trim() || null,
    address: String(formData.get("address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
  };
}

// guests_rw RLS is open to any property member (front_desk needs to manage
// guest records day-to-day), unlike room_types/rooms which are owner/admin.
export async function createGuest(
  _prevState: GuestActionState,
  formData: FormData
): Promise<GuestActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const fields = fieldsFromForm(formData);
  if (!fields.name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("guests").insert({ property_id: property.id, ...fields });
  if (error) return { error: error.message };

  revalidatePath("/guests");
  return { error: null };
}

export async function updateGuest(
  _prevState: GuestActionState,
  formData: FormData
): Promise<GuestActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const guestId = String(formData.get("guestId") ?? "");
  const fields = fieldsFromForm(formData);
  if (!guestId) return { error: "Missing guest." };
  if (!fields.name) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update(fields)
    .eq("id", guestId)
    .eq("property_id", property.id);
  if (error) return { error: error.message };

  revalidatePath("/guests");
  revalidatePath(`/guests/${guestId}`);
  return { error: null };
}
