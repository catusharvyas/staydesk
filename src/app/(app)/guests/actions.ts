"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";

export type GuestActionState = { error: string | null };

// Deliberately lenient — front-desk speed (PROJECT.md §1) matters more than
// catching every malformed phone number, and hotels do get foreign guests
// whose numbers won't fit a strict Indian-mobile pattern. Just enough to
// catch "that's obviously not a phone number".
const PHONE_REGEX = /^[0-9+\-\s]{8,15}$/;
// Aadhaar and PAN both have fixed, unambiguous, always-Indian formats, so
// these two (and only these two) are validated strictly.
const AADHAAR_REGEX = /^\d{12}$/;
const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;

const guestFieldsSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    phone: z.string().trim(),
    email: z.string().trim(),
    idProofType: z.string().trim(),
    idProofTypeOther: z.string().trim(),
    idProofNumber: z.string().trim(),
    nationality: z.string().trim(),
    address: z.string().trim(),
    notes: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.phone && !PHONE_REGEX.test(data.phone)) {
      ctx.addIssue({ code: "custom", path: ["phone"], message: "Enter a valid phone number." });
    }
    if (data.email && !z.email().safeParse(data.email).success) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Enter a valid email address." });
    }
    if (data.idProofType === "Other" && !data.idProofTypeOther) {
      ctx.addIssue({
        code: "custom",
        path: ["idProofTypeOther"],
        message: "Specify the ID proof type.",
      });
    }
    if (data.idProofType === "Aadhaar" && data.idProofNumber && !AADHAAR_REGEX.test(data.idProofNumber)) {
      ctx.addIssue({
        code: "custom",
        path: ["idProofNumber"],
        message: "Aadhaar number must be 12 digits.",
      });
    }
    if (
      data.idProofType === "PAN" &&
      data.idProofNumber &&
      !PAN_REGEX.test(data.idProofNumber.toUpperCase())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["idProofNumber"],
        message: "PAN must be in the format ABCDE1234F.",
      });
    }
  });

type ParsedGuestFields = {
  name: string;
  phone: string | null;
  email: string | null;
  id_proof_type: string | null;
  id_proof_number: string | null;
  nationality: string | null;
  address: string | null;
  notes: string | null;
};

// `ok` (a literal true/false) is the discriminant, not `error` — a plain
// `string` type can't act as a discriminant (TS only narrows on literal
// types), so `if (parsed.error)` alone wouldn't have narrowed `fields`
// from `ParsedGuestFields | undefined` at the call sites below.
function fieldsFromForm(
  formData: FormData
): { ok: false; error: string } | { ok: true; fields: ParsedGuestFields } {
  const raw = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    idProofType: String(formData.get("idProofType") ?? ""),
    idProofTypeOther: String(formData.get("idProofTypeOther") ?? ""),
    idProofNumber: String(formData.get("idProofNumber") ?? ""),
    nationality: String(formData.get("nationality") ?? ""),
    address: String(formData.get("address") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  };

  const parsed = guestFieldsSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const v = parsed.data;
  // "Other" isn't a real ID proof type to store — save what the user typed
  // in its place, so the guest detail page always shows something
  // meaningful instead of the literal word "Other".
  const idProofType = v.idProofType === "Other" ? v.idProofTypeOther : v.idProofType;
  const idProofNumber = v.idProofType === "PAN" ? v.idProofNumber.toUpperCase() : v.idProofNumber;

  return {
    ok: true,
    fields: {
      name: v.name,
      phone: v.phone || null,
      email: v.email || null,
      id_proof_type: idProofType || null,
      id_proof_number: idProofNumber || null,
      nationality: v.nationality || null,
      address: v.address || null,
      notes: v.notes || null,
    },
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

  const parsed = fieldsFromForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("guests").insert({ property_id: property.id, ...parsed.fields });
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
  if (!guestId) return { error: "Missing guest." };

  const parsed = fieldsFromForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guests")
    .update(parsed.fields)
    .eq("id", guestId)
    .eq("property_id", property.id);
  if (error) return { error: error.message };

  revalidatePath("/guests");
  revalidatePath(`/guests/${guestId}`);
  return { error: null };
}
