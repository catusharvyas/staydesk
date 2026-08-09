"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";

export type PricingActionState = { error: string | null };

async function assertBookingInProperty(bookingId: string, propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("id, room_id")
    .eq("id", bookingId)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function addBookingCharge(
  _prevState: PricingActionState,
  formData: FormData
): Promise<PricingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const taxable = formData.get("taxable") === "on";

  if (!description || !Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a description and a valid amount." };
  }

  const booking = await assertBookingInProperty(bookingId, property.id);
  if (!booking) return { error: "Booking not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_charges")
    .insert({ booking_id: bookingId, description, amount, taxable });
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${booking.room_id}`);
  return { error: null };
}

export async function recordPayment(
  _prevState: PricingActionState,
  formData: FormData
): Promise<PricingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const amount = Number(formData.get("amount"));
  const mode = String(formData.get("mode") ?? "");
  const reference = String(formData.get("reference") ?? "").trim();

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid amount." };
  }
  if (!["cash", "upi", "card", "bank_transfer"].includes(mode)) {
    return { error: "Select a payment mode." };
  }

  const booking = await assertBookingInProperty(bookingId, property.id);
  if (!booking) return { error: "Booking not found." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("payments").insert({
    booking_id: bookingId,
    amount,
    mode: mode as "cash" | "upi" | "card" | "bank_transfer",
    reference: reference || null,
    received_by: user?.id ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${booking.room_id}`);
  return { error: null };
}

export async function updateBookingPricing(
  _prevState: PricingActionState,
  formData: FormData
): Promise<PricingActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const rateOverrideRaw = String(formData.get("rateOverride") ?? "").trim();
  const discountRaw = String(formData.get("discount") ?? "").trim();

  const rateOverride = rateOverrideRaw ? Number(rateOverrideRaw) : null;
  const discount = discountRaw ? Number(discountRaw) : 0;

  if (rateOverride !== null && (!Number.isFinite(rateOverride) || rateOverride < 0)) {
    return { error: "Rate override must be a valid number." };
  }
  if (!Number.isFinite(discount) || discount < 0) {
    return { error: "Discount must be a valid number." };
  }

  const booking = await assertBookingInProperty(bookingId, property.id);
  if (!booking) return { error: "Booking not found." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ rate_override: rateOverride, discount })
    .eq("id", bookingId);
  if (error) return { error: error.message };

  revalidatePath(`/rooms/${booking.room_id}`);
  return { error: null };
}
