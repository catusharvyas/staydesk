"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";

export type PropertyActionState = { error: string | null; saved: boolean };

// Strict only where the format is genuinely fixed and unambiguous — same
// rule the guest form follows (PROJECT.md §10 "Guest form validation").
// All three are optional; the check only runs on a non-empty value.
const PAN_REGEX = /^[A-Z]{5}\d{4}[A-Z]$/;
// 2-digit state code + 10-char PAN + entity number + 'Z' + checksum.
const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
// L/U + 5-digit industry code + 2-letter state + 4-digit year + 3-letter
// ownership type + 6-digit registration number.
const CIN_REGEX = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
const STATE_CODE_REGEX = /^\d{2}$/;

const propertyFieldsSchema = z
  .object({
    name: z.string().trim().min(1, "Property name is required."),
    legalName: z.string().trim(),
    address: z.string().trim(),
    stateCode: z.string().trim(),
    gstin: z.string().trim(),
    pan: z.string().trim(),
    cin: z.string().trim(),
  })
  .superRefine((data, ctx) => {
    if (data.stateCode && !STATE_CODE_REGEX.test(data.stateCode)) {
      ctx.addIssue({
        code: "custom",
        path: ["stateCode"],
        message: "State code must be 2 digits (e.g. 27 for Maharashtra).",
      });
    }
    if (data.gstin && !GSTIN_REGEX.test(data.gstin.toUpperCase())) {
      ctx.addIssue({
        code: "custom",
        path: ["gstin"],
        message: "GSTIN must be 15 characters, e.g. 27ABCDE1234F1Z5.",
      });
    }
    if (data.pan && !PAN_REGEX.test(data.pan.toUpperCase())) {
      ctx.addIssue({
        code: "custom",
        path: ["pan"],
        message: "PAN must be in the format ABCDE1234F.",
      });
    }
    if (data.cin && !CIN_REGEX.test(data.cin.toUpperCase())) {
      ctx.addIssue({
        code: "custom",
        path: ["cin"],
        message: "CIN must be 21 characters, e.g. U55101MH2020PTC123456.",
      });
    }
    // A GSTIN embeds the state code in its first two characters, so a
    // mismatch between the two means one of them is wrong — and this pair
    // is exactly what decides CGST+SGST vs IGST at invoice time (§4).
    if (
      data.gstin &&
      data.stateCode &&
      GSTIN_REGEX.test(data.gstin.toUpperCase()) &&
      STATE_CODE_REGEX.test(data.stateCode) &&
      data.gstin.slice(0, 2) !== data.stateCode
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["gstin"],
        message: `GSTIN starts with ${data.gstin.slice(0, 2)} but the state code is ${data.stateCode} — these must match.`,
      });
    }
  });

export async function updateProperty(
  _prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found.", saved: false };
  // properties_update RLS (0002_rls.sql) already restricts this to
  // owner/admin — this app-level check just gives a friendlier message
  // than a raw RLS denial, matching updateTaxSettings.
  if (property.role !== "owner" && property.role !== "admin") {
    return { error: "Only owners and admins can change property details.", saved: false };
  }

  const parsed = propertyFieldsSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    legalName: String(formData.get("legalName") ?? ""),
    address: String(formData.get("address") ?? ""),
    stateCode: String(formData.get("stateCode") ?? ""),
    gstin: String(formData.get("gstin") ?? ""),
    pan: String(formData.get("pan") ?? ""),
    cin: String(formData.get("cin") ?? ""),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input.", saved: false };
  }

  const v = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({
      name: v.name,
      legal_name: v.legalName || null,
      address: v.address || null,
      state_code: v.stateCode || null,
      gstin: v.gstin ? v.gstin.toUpperCase() : null,
      pan: v.pan ? v.pan.toUpperCase() : null,
      cin: v.cin ? v.cin.toUpperCase() : null,
    })
    .eq("id", property.id);

  if (error) return { error: error.message, saved: false };

  revalidatePath("/settings/property");
  // Invoices render the property header (name/legal name/address/GSTIN),
  // so a change here has to invalidate them too.
  revalidatePath("/bookings", "layout");
  return { error: null, saved: true };
}
