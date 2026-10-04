"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProperty, type OnboardingState } from "./actions";

const INITIAL_STATE: OnboardingState = { error: null };

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createProperty, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="orgName">Organization name</Label>
        <Input id="orgName" name="orgName" required placeholder="e.g. Sharma Hospitality" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="propertyName">Property name</Label>
        <Input id="propertyName" name="propertyName" required placeholder="e.g. Sharma Residency" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="stateCode">State code (for GST)</Label>
        <Input id="stateCode" name="stateCode" placeholder="e.g. 27 (Maharashtra)" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="gstin">GSTIN (optional)</Label>
        <Input id="gstin" name="gstin" placeholder="Add later in Settings if not registered yet" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Creating…" : "Create property"}
      </Button>
    </form>
  );
}
