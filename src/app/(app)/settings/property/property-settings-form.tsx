"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProperty, type PropertyActionState } from "./actions";
import type { Tables } from "@/lib/supabase/database.types";

const INITIAL_STATE: PropertyActionState = { error: null, saved: false };

// No Textarea in components/ui yet — this mirrors Input's classes so the
// multi-line address field matches every other field on the page. Promote
// to a shared component if a second textarea ever shows up.
const TEXTAREA_CLASS =
  "w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30";

export function PropertySettingsForm({ property }: { property: Tables<"properties"> }) {
  const [state, formAction, pending] = useActionState(updateProperty, INITIAL_STATE);

  return (
    // Keyed on the saved values so a successful save remounts the fields
    // against their new defaults rather than mutating already-initialized
    // uncontrolled inputs — same reason the room-edit form does this.
    <form
      key={`${property.name}|${property.legal_name}|${property.gstin}`}
      action={formAction}
      className="flex max-w-md flex-col gap-4"
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Property name</Label>
        <Input id="name" name="name" required defaultValue={property.name} />
        <p className="text-xs text-muted-foreground">
          The trading/brand name guests see.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="legalName">Legal entity name</Label>
        <Input
          id="legalName"
          name="legalName"
          defaultValue={property.legal_name ?? ""}
          placeholder="e.g. Sharma Hospitality Pvt Ltd"
        />
        <p className="text-xs text-muted-foreground">
          Printed on tax invoices. Falls back to the property name if left blank.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="address">Address</Label>
        <textarea
          id="address"
          name="address"
          rows={3}
          defaultValue={property.address ?? ""}
          placeholder={"e.g. 12 MG Road\nPune, Maharashtra 411001"}
          className={TEXTAREA_CLASS}
        />
        <p className="text-xs text-muted-foreground">
          Required on a GST tax invoice — this is what prints in the invoice header.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stateCode">State code (for GST)</Label>
        <Input
          id="stateCode"
          name="stateCode"
          inputMode="numeric"
          maxLength={2}
          defaultValue={property.state_code ?? ""}
          placeholder="e.g. 27 (Maharashtra)"
        />
        <p className="text-xs text-muted-foreground">
          Decides CGST + SGST vs IGST at invoice time.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gstin">GSTIN</Label>
        <Input
          id="gstin"
          name="gstin"
          maxLength={15}
          className="uppercase"
          defaultValue={property.gstin ?? ""}
          placeholder="27ABCDE1234F1Z5"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="pan">PAN</Label>
        <Input
          id="pan"
          name="pan"
          maxLength={10}
          className="uppercase"
          defaultValue={property.pan ?? ""}
          placeholder="ABCDE1234F"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cin">CIN (optional)</Label>
        <Input
          id="cin"
          name="cin"
          maxLength={21}
          className="uppercase"
          defaultValue={property.cin ?? ""}
          placeholder="U55101MH2020PTC123456"
        />
        <p className="text-xs text-muted-foreground">
          Only registered companies have a CIN — leave blank for a
          proprietorship or partnership.
        </p>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state.saved && !state.error && (
        <p className="text-sm text-muted-foreground">Property details saved.</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save property details"}
      </Button>
    </form>
  );
}
