"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";

export type TaxSettingsActionState = { error: string | null };

export async function updateTaxSettings(
  _prevState: TaxSettingsActionState,
  formData: FormData
): Promise<TaxSettingsActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };
  if (property.role !== "owner" && property.role !== "admin") {
    return { error: "Only owners and admins can change tax settings." };
  }

  const gstEnabled = formData.get("gstEnabled") === "on";
  const rateBand1Threshold = Number(formData.get("rateBand1Threshold"));
  const rateBand1Rate = Number(formData.get("rateBand1Rate"));
  const rateBand2Rate = Number(formData.get("rateBand2Rate"));
  const intraStateSplit = formData.get("intraStateSplit") === "on";
  const roundingMode = String(formData.get("roundingMode") ?? "nearest");

  if (
    !Number.isFinite(rateBand1Threshold) ||
    !Number.isFinite(rateBand1Rate) ||
    !Number.isFinite(rateBand2Rate)
  ) {
    return { error: "Rate band values must be valid numbers." };
  }
  if (!["none", "nearest", "up", "down"].includes(roundingMode)) {
    return { error: "Invalid rounding mode." };
  }

  const supabase = await createClient();
  // tax_settings_write RLS restricts this to owner/admin — this app-level
  // check just gives a friendlier message than a raw RLS denial.
  const { error } = await supabase
    .from("tax_settings")
    .update({
      gst_enabled: gstEnabled,
      rate_band_1_threshold: rateBand1Threshold,
      rate_band_1_rate: rateBand1Rate,
      rate_band_2_rate: rateBand2Rate,
      intra_state_split: intraStateSplit,
      rounding_mode: roundingMode as "none" | "nearest" | "up" | "down",
    })
    .eq("property_id", property.id);

  if (error) return { error: error.message };

  revalidatePath("/settings/tax");
  return { error: null };
}
