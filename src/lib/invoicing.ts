import { createClient } from "@/lib/supabase/server";
import { calculateBookingPricing, nightsBetween } from "@/lib/pricing";

export type GenerateInvoiceResult = { error: string | null; invoiceId?: string };

/**
 * Generates an invoice for a booking, if one doesn't already exist. Reuses
 * calculateBookingPricing() from src/lib/pricing.ts — the invoice's
 * taxable_value/cgst/sgst/igst/total are never computed independently, per
 * the single-source-of-truth rule (PROJECT.md §4/§9). Called automatically
 * from checkOutBooking (best-effort — a failure here must not block
 * checkout), and available as a manual retry via the "use server" wrapper
 * in bookings/invoice-actions.ts.
 */
export async function generateInvoiceForBooking(
  propertyId: string,
  bookingId: string
): Promise<GenerateInvoiceResult> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("booking_id", bookingId)
    .maybeSingle();
  if (existing) return { error: null, invoiceId: existing.id };

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, rooms(room_types(base_rate))")
    .eq("id", bookingId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (bookingError || !booking) {
    return { error: bookingError?.message ?? "Booking not found." };
  }

  const [{ data: charges, error: chargesError }, { data: taxSettings, error: taxError }] =
    await Promise.all([
      supabase.from("booking_charges").select("amount, taxable").eq("booking_id", bookingId),
      supabase.from("tax_settings").select("*").eq("property_id", propertyId).maybeSingle(),
    ]);
  if (chargesError) return { error: chargesError.message };
  if (taxError) return { error: taxError.message };
  if (!taxSettings) return { error: "No tax settings configured for this property." };

  const ratePerNight = booking.rate_override ?? booking.rooms?.room_types?.base_rate ?? 0;
  const nights = nightsBetween(booking.check_in_planned, booking.check_out_planned);
  const pricing = calculateBookingPricing({
    nights,
    ratePerNight,
    discount: booking.discount,
    charges: (charges ?? []).map((c) => ({ amount: c.amount, taxable: c.taxable })),
    taxSettings,
  });

  const { data: seq, error: seqError } = await supabase.rpc("next_invoice_number", {
    p_property_id: propertyId,
  });
  if (seqError || seq == null) {
    return { error: seqError?.message ?? "Could not allocate an invoice number." };
  }

  const invoiceNumber = `INV-${String(seq).padStart(4, "0")}`;

  const { data: invoice, error: insertError } = await supabase
    .from("invoices")
    .insert({
      property_id: propertyId,
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      taxable_value: pricing.taxableValue,
      cgst: pricing.cgst,
      sgst: pricing.sgst,
      igst: pricing.igst,
      total: pricing.grandTotal,
    })
    .select("id")
    .single();
  if (insertError) return { error: insertError.message };

  return { error: null, invoiceId: invoice.id };
}
