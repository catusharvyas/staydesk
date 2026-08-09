import { createClient } from "@/lib/supabase/server";

export async function getInvoiceByBooking(propertyId: string, bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("*")
    .eq("property_id", propertyId)
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Everything the printable invoice page needs, in one query. */
export async function getInvoiceDetails(propertyId: string, bookingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `*,
      rooms(number, room_types(name, base_rate)),
      guests(name, phone, email, address),
      booking_charges(*),
      payments(*)`
    )
    .eq("property_id", propertyId)
    .eq("id", bookingId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
