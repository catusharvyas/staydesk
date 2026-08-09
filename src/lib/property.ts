import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type CurrentProperty = Tables<"properties"> & {
  role: Tables<"property_users">["role"];
};

/**
 * Resolves the signed-in user's property for this request. A user can
 * belong to multiple properties (PROJECT.md §3); V1 just uses the first
 * one — switching between properties is a later-phase concern.
 * Returns null if the user isn't signed in, or has no property yet
 * (→ send them to /onboarding).
 *
 * Wrapped in React's `cache()` so the (app) layout and each page can both
 * call this without doubling the round trip within one request.
 */
export const getCurrentProperty = cache(async (): Promise<CurrentProperty | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("property_users")
    .select("role, properties(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (error || !data || !data.properties) return null;

  return { ...data.properties, role: data.role };
});
