"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addBookingCharge,
  recordPayment,
  updateBookingPricing,
  type PricingActionState,
} from "../../bookings/pricing-actions";

const INITIAL_STATE: PricingActionState = { error: null };

export function RateDiscountForm({
  bookingId,
  rateOverride,
  discount,
}: {
  bookingId: string;
  rateOverride: number | null;
  discount: number;
}) {
  const [state, formAction, pending] = useActionState(updateBookingPricing, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="rateOverride" className="text-xs">Rate override (₹/night)</Label>
        <Input
          id="rateOverride"
          name="rateOverride"
          type="number"
          min="0"
          defaultValue={rateOverride ?? ""}
          placeholder="Room type rate"
          className="h-9 w-36"
        />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="discount" className="text-xs">Discount (₹)</Label>
        <Input
          id="discount"
          name="discount"
          type="number"
          min="0"
          defaultValue={discount || ""}
          className="h-9 w-28"
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Save"}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

export function AddChargeForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(addBookingCharge, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="chargeDesc" className="text-xs">Description</Label>
        <Input id="chargeDesc" name="description" placeholder="Extra bed" required className="h-9 w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="chargeAmount" className="text-xs">Amount (₹)</Label>
        <Input id="chargeAmount" name="amount" type="number" min="0" required className="h-9 w-24" />
      </div>
      <label className="flex items-center gap-1.5 pb-2 text-xs">
        <input type="checkbox" name="taxable" defaultChecked className="h-4 w-4" />
        Taxable
      </label>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : "Add charge"}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

const PAYMENT_MODES: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank transfer",
};

export function RecordPaymentForm({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(recordPayment, INITIAL_STATE);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>Receive Payment</Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2 rounded-xl bg-muted/60 p-3.5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="paymentAmount" className="text-xs">Amount (₹)</Label>
        <Input id="paymentAmount" name="amount" type="number" min="0" required className="h-9 w-28" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Mode</Label>
        <Select name="mode" items={PAYMENT_MODES} required>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder="Select mode" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(PAYMENT_MODES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="paymentRef" className="text-xs">Reference</Label>
        <Input id="paymentRef" name="reference" placeholder="Optional" className="h-9 w-32" />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "…" : "Save payment"}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}
