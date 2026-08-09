import { createClient } from "@/lib/supabase/server";
import { getTaxSettings } from "@/lib/queries/pricing";
import { calculateBookingPricing, nightsBetween } from "@/lib/pricing";
import type { Enums } from "@/lib/supabase/database.types";

type PaymentMode = Enums<"payment_mode">;

// All of these aggregate client-side over a date-filtered select — fine at
// the data volumes a single property produces, but if this ever needs to
// scale to a chain's worth of history, move the aggregation into a SQL
// view/RPC instead of pulling rows and summing in JS.

export async function getRevenueByMode(propertyId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("amount, mode, bookings!inner(property_id)")
    .eq("bookings.property_id", propertyId)
    .gte("received_at", from)
    .lt("received_at", `${to}T23:59:59`);

  if (error) throw error;

  const byMode: Record<PaymentMode, number> = { cash: 0, upi: 0, card: 0, bank_transfer: 0 };
  let total = 0;
  for (const p of data ?? []) {
    byMode[p.mode] += p.amount;
    total += p.amount;
  }
  return { byMode, total };
}

export async function getGstSummary(propertyId: string, from: string, to: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("taxable_value, cgst, sgst, igst, total")
    .eq("property_id", propertyId)
    .gte("issued_at", from)
    .lt("issued_at", `${to}T23:59:59`);

  if (error) throw error;

  return (data ?? []).reduce(
    (acc, i) => ({
      taxableValue: acc.taxableValue + i.taxable_value,
      cgst: acc.cgst + i.cgst,
      sgst: acc.sgst + i.sgst,
      igst: acc.igst + i.igst,
      total: acc.total + i.total,
      count: acc.count + 1,
    }),
    { taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0, count: 0 }
  );
}

export async function getArrivalsDepartures(propertyId: string, from: string, to: string) {
  const supabase = await createClient();
  const [arrivals, departures] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .gte("check_in_planned", from)
      .lte("check_in_planned", to)
      .neq("status", "cancelled"),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("property_id", propertyId)
      .gte("check_out_planned", from)
      .lte("check_out_planned", to)
      .neq("status", "cancelled"),
  ]);

  return { arrivals: arrivals.count ?? 0, departures: departures.count ?? 0 };
}

export async function getOccupancySnapshot(propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("rooms").select("status").eq("property_id", propertyId);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return counts;
}

/**
 * Bookings currently owing money — checked_in (still staying) or
 * checked_out (invoiced but not fully paid). Not date-range scoped: "who
 * owes money right now" is a current-state question, not a historical one.
 * Uses the frozen invoice total where one exists, otherwise a live
 * calculateBookingPricing() — same reasoning as the invoice page.
 */
export async function getOutstandingBalances(propertyId: string) {
  const supabase = await createClient();
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(
      `id, status, check_in_planned, check_out_planned, rate_override, discount,
      rooms(number, room_types(base_rate)),
      guests(name, phone),
      booking_charges(amount, taxable),
      payments(amount),
      invoices(total)`
    )
    .eq("property_id", propertyId)
    .in("status", ["checked_in", "checked_out"]);

  if (error) throw error;

  const taxSettings = await getTaxSettings(propertyId);

  const results: { bookingId: string; guestName: string; roomNumber: string; balance: number }[] = [];

  for (const b of bookings ?? []) {
    const paid = (b.payments ?? []).reduce((sum, p) => sum + p.amount, 0);

    let total: number;
    const invoice = Array.isArray(b.invoices) ? b.invoices[0] : b.invoices;
    if (invoice) {
      total = invoice.total;
    } else if (taxSettings) {
      const ratePerNight = b.rate_override ?? b.rooms?.room_types?.base_rate ?? 0;
      const nights = nightsBetween(b.check_in_planned, b.check_out_planned);
      const pricing = calculateBookingPricing({
        nights,
        ratePerNight,
        discount: b.discount,
        charges: (b.booking_charges ?? []).map((c) => ({ amount: c.amount, taxable: c.taxable })),
        taxSettings,
      });
      total = pricing.grandTotal;
    } else {
      continue;
    }

    const balance = round2(total - paid);
    if (balance > 0.01) {
      results.push({
        bookingId: b.id,
        guestName: b.guests?.name ?? "",
        roomNumber: b.rooms?.number ?? "",
        balance,
      });
    }
  }

  return results;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
