"use client";

import { useActionState } from "react";
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
import { updateTaxSettings, type TaxSettingsActionState } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";

const INITIAL_STATE: TaxSettingsActionState = { error: null };

const ROUNDING_ITEMS: Record<string, string> = {
  none: "No rounding",
  nearest: "Nearest rupee",
  up: "Round up",
  down: "Round down",
};

export function TaxSettingsForm({ settings }: { settings: Tables<"tax_settings"> }) {
  const [state, formAction, pending] = useActionState(updateTaxSettings, INITIAL_STATE);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="gstEnabled" defaultChecked={settings.gst_enabled} className="h-4 w-4" />
        GST enabled
      </label>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rateBand1Threshold">Rate band 1 threshold (taxable value ₹)</Label>
        <Input
          id="rateBand1Threshold"
          name="rateBand1Threshold"
          type="number"
          min="0"
          defaultValue={settings.rate_band_1_threshold}
        />
        <p className="text-xs text-muted-foreground">
          Bookings with taxable value below this use band 1&apos;s rate; at or above use band 2&apos;s.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="rateBand1Rate">Band 1 rate (%)</Label>
          <Input
            id="rateBand1Rate"
            name="rateBand1Rate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.rate_band_1_rate}
          />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="rateBand2Rate">Band 2 rate (%)</Label>
          <Input
            id="rateBand2Rate"
            name="rateBand2Rate"
            type="number"
            min="0"
            step="0.01"
            defaultValue={settings.rate_band_2_rate}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="intraStateSplit"
          defaultChecked={settings.intra_state_split}
          className="h-4 w-4"
        />
        Split as CGST + SGST (intra-state). Unchecked shows a single IGST line.
      </label>

      <div className="flex flex-col gap-1.5">
        <Label>Rounding</Label>
        <Select name="roundingMode" items={ROUNDING_ITEMS} defaultValue={settings.rounding_mode}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROUNDING_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save tax settings"}
      </Button>
    </form>
  );
}
