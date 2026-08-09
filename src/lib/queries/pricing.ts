import { createClient } from "@/lib/supabase/server";

export async function getTaxSettings(propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tax_settings")
    .select("*")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getBookingCharges(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("booking_charges")
    .select("*")
    .eq("booking_id", bookingId)
    .order("created_at");

  if (error) throw error;
  return data;
}

export async function getPayments(bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", bookingId)
    .order("received_at");

  if (error) throw error;
  return data;
}
