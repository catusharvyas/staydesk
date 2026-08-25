"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";
import {
  PROPERTY_LOGO_BUCKET,
  LOGO_MAX_BYTES,
  LOGO_MIME_TYPES,
  extensionForMime,
} from "@/lib/property-logo";
import { resolveTheme } from "@/lib/theme-presets";

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

export type ThemeActionState = { error: string | null; saved: boolean };

/**
 * Sets the property's accent preset. The value is narrowed through
 * resolveTheme() rather than written straight from the form: `theme` selects
 * a CSS block by name, and the DB's CHECK constraint would reject an unknown
 * key anyway — this just turns that into a clean fallback instead of a raw
 * constraint-violation message.
 */
export async function updatePropertyTheme(
  _prevState: ThemeActionState,
  formData: FormData
): Promise<ThemeActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found.", saved: false };
  if (property.role !== "owner" && property.role !== "admin") {
    return { error: "Only owners and admins can change the theme.", saved: false };
  }

  const theme = resolveTheme(String(formData.get("theme") ?? ""));

  const supabase = await createClient();
  const { error } = await supabase
    .from("properties")
    .update({ theme })
    .eq("id", property.id);
  if (error) return { error: error.message, saved: false };

  // The accent is applied from the ROOT layout (it has to be on <html> for
  // portalled UI), so revalidating just this route would leave every other
  // page still painted in the old colour. "layout" scope from the root path
  // is what actually repaints the whole app.
  revalidatePath("/", "layout");
  return { error: null, saved: true };
}

export type LogoActionState = { error: string | null; saved: boolean };

/**
 * Uploads a brand logo and points `properties.logo_path` at it.
 *
 * Each upload gets a UNIQUE filename (`logo-<timestamp>.<ext>`) rather than
 * overwriting a fixed `logo.png`. The bucket is public and therefore
 * CDN-cached, so reusing one path would leave the old image being served
 * after a replacement — a new path sidesteps cache invalidation entirely.
 * The previous object is deleted afterwards, best-effort: an orphaned file
 * is harmless, but failing the user's action over one would not be.
 */
export async function uploadPropertyLogo(
  _prevState: LogoActionState,
  formData: FormData
): Promise<LogoActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found.", saved: false };
  if (property.role !== "owner" && property.role !== "admin") {
    return { error: "Only owners and admins can change the logo.", saved: false };
  }

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload.", saved: false };
  }
  // Storage enforces both of these too (0010), but a raw storage rejection
  // reads as an opaque error — these give the actual reason.
  if (!(LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { error: "Logo must be a PNG or JPEG image.", saved: false };
  }
  if (file.size > LOGO_MAX_BYTES) {
    return { error: "Logo must be 1 MB or smaller.", saved: false };
  }
  const ext = extensionForMime(file.type);
  if (!ext) return { error: "Logo must be a PNG or JPEG image.", saved: false };

  const supabase = await createClient();
  const previousPath = property.logo_path;
  // First path segment must be the property id — that's what the
  // property_logos_write storage policy checks.
  const newPath = `${property.id}/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PROPERTY_LOGO_BUCKET)
    .upload(newPath, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: uploadError.message, saved: false };

  const { error: updateError } = await supabase
    .from("properties")
    .update({ logo_path: newPath })
    .eq("id", property.id);
  if (updateError) {
    // Don't leave an orphan behind if the row update is what failed.
    await supabase.storage.from(PROPERTY_LOGO_BUCKET).remove([newPath]);
    return { error: updateError.message, saved: false };
  }

  if (previousPath && previousPath !== newPath) {
    await supabase.storage.from(PROPERTY_LOGO_BUCKET).remove([previousPath]);
  }

  revalidatePath("/settings/property");
  revalidatePath("/bookings", "layout");
  return { error: null, saved: true };
}

// Both parameters are required by useActionState's action signature even
// though removal needs neither — there's nothing to read off the form.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function removePropertyLogo(_prevState: LogoActionState, _formData: FormData): Promise<LogoActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found.", saved: false };
  if (property.role !== "owner" && property.role !== "admin") {
    return { error: "Only owners and admins can change the logo.", saved: false };
  }
  if (!property.logo_path) return { error: null, saved: true };

  const supabase = await createClient();
  // Clear the reference first: a dangling logo_path would render a broken
  // image, whereas a leftover object nothing points at is invisible.
  const { error } = await supabase
    .from("properties")
    .update({ logo_path: null })
    .eq("id", property.id);
  if (error) return { error: error.message, saved: false };

  await supabase.storage.from(PROPERTY_LOGO_BUCKET).remove([property.logo_path]);

  revalidatePath("/settings/property");
  revalidatePath("/bookings", "layout");
  return { error: null, saved: true };
}
