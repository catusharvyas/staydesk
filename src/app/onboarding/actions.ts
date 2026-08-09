"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error: string | null };

export async function createProperty(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const orgName = String(formData.get("orgName") ?? "").trim();
  const propertyName = String(formData.get("propertyName") ?? "").trim();
  const stateCode = String(formData.get("stateCode") ?? "").trim();
  const gstin = String(formData.get("gstin") ?? "").trim();

  if (!orgName || !propertyName) {
    return { error: "Organization and property name are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("bootstrap_property", {
    p_org_name: orgName,
    p_property_name: propertyName,
    p_state_code: stateCode,
    p_gstin: gstin,
  });

  if (error) return { error: error.message };

  redirect("/dashboard");
}
