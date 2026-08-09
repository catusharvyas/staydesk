import { createClient } from "@/lib/supabase/server";

export async function listGuestsWithSearch(propertyId: string, search: string) {
  const supabase = await createClient();
  let query = supabase
    .from("guests")
    .select("*")
    .eq("property_id", propertyId)
    .order("name");

  if (search.trim()) {
    // matches name OR phone — front desk usually searches by whichever they have on hand
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getGuest(propertyId: string, guestId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select("*")
    .eq("property_id", propertyId)
    .eq("id", guestId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getGuestStayHistory(propertyId: string, guestId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, status, check_in_planned, check_out_planned, check_in_actual, check_out_actual, rooms(number)")
    .eq("property_id", propertyId)
    .eq("guest_id", guestId)
    .order("check_in_planned", { ascending: false });

  if (error) throw error;
  return data;
}
