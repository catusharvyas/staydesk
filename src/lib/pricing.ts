// Single source of truth for the pricing/GST math (PROJECT.md §4/§5) — the
// spec explicitly calls out that this must not be duplicated between a UI
// preview and actual invoice generation. Both the room detail page (Phase 5)
// and invoice generation (Phase 6) should import from here, not reimplement.
//
// Verified against the source spec's worked example: rate×nights 7000,
// discount 500 → taxable 6500 → GST 780 (12%, since 6500 < 7500 threshold)
// → grand total 7280 → advance 2000 → balance 5280. This module reproduces
// that exactly (see the test-like assertion in PROJECT.md §9).

import type { Tables } from "@/lib/supabase/database.types";

export type TaxSettings = Pick<
  Tables<"tax_settings">,
  | "gst_enabled"
  | "rate_band_1_threshold"
  | "rate_band_1_rate"
  | "rate_band_2_rate"
  | "intra_state_split"
  | "rounding_mode"
>;

export type Charge = { amount: number; taxable: boolean };

export type PricingInput = {
  nights: number;
  ratePerNight: number;
  discount: number;
  charges: Charge[];
  taxSettings: TaxSettings;
};

export type PricingResult = {
  roomCharge: number;
  taxableCharges: number;
  nonTaxableCharges: number;
  taxableValue: number;
  gstRate: number;
  gstAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
};

function selectGstRate(taxableValue: number, tax: TaxSettings): number {
  if (!tax.gst_enabled) return 0;
  return taxableValue < tax.rate_band_1_threshold
    ? tax.rate_band_1_rate
    : tax.rate_band_2_rate;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function applyRounding(value: number, mode: TaxSettings["rounding_mode"]): number {
  switch (mode) {
    case "nearest":
      return Math.round(value);
    case "up":
      return Math.ceil(value);
    case "down":
      return Math.floor(value);
    default:
      return round2(value);
  }
}

export function calculateBookingPricing(input: PricingInput): PricingResult {
  const { nights, ratePerNight, discount, charges, taxSettings } = input;

  const roomCharge = round2(nights * ratePerNight - discount);
  const taxableCharges = round2(
    charges.filter((c) => c.taxable).reduce((sum, c) => sum + c.amount, 0)
  );
  const nonTaxableCharges = round2(
    charges.filter((c) => !c.taxable).reduce((sum, c) => sum + c.amount, 0)
  );

  const taxableValue = round2(roomCharge + taxableCharges);
  const gstRate = selectGstRate(taxableValue, taxSettings);
  const gstAmount = round2((taxableValue * gstRate) / 100);

  // Place of supply for hotel accommodation is the property's own location,
  // so in practice this is almost always intra-state (CGST+SGST) — IGST is
  // the rare exception. `intra_state_split` just controls how the same
  // gstAmount is presented (split vs single line), per property settings.
  const cgst = taxSettings.intra_state_split ? round2(gstAmount / 2) : 0;
  const sgst = taxSettings.intra_state_split ? round2(gstAmount / 2) : 0;
  const igst = taxSettings.intra_state_split ? 0 : gstAmount;

  const grandTotal = applyRounding(
    taxableValue + gstAmount + nonTaxableCharges,
    taxSettings.rounding_mode
  );

  return {
    roomCharge,
    taxableCharges,
    nonTaxableCharges,
    taxableValue,
    gstRate,
    gstAmount,
    cgst,
    sgst,
    igst,
    grandTotal,
  };
}

/** Nights between two YYYY-MM-DD date strings. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}
