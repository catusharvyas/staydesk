"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGuest, updateGuest, type GuestActionState } from "./actions";

const INITIAL_STATE: GuestActionState = { error: null };

function Field({
  id,
  name,
  label,
  defaultValue,
  type = "text",
}: {
  id: string;
  name: string;
  label: string;
  defaultValue?: string | null;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} defaultValue={defaultValue ?? ""} />
    </div>
  );
}

export function AddGuestForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createGuest, INITIAL_STATE);

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        + New guest
      </Button>
    );
  }

  return (
    <form action={formAction} className="grid max-w-lg grid-cols-2 gap-3 rounded-lg border p-4">
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="g-name">Name</Label>
        <Input id="g-name" name="name" required />
      </div>
      <Field id="g-phone" name="phone" label="Phone" />
      <Field id="g-email" name="email" label="Email" type="email" />
      <Field id="g-idtype" name="idProofType" label="ID proof type" />
      <Field id="g-idnum" name="idProofNumber" label="ID proof number" />
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="g-address">Address</Label>
        <Input id="g-address" name="address" />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="g-notes">Notes</Label>
        <Input id="g-notes" name="notes" />
      </div>

      {state.error && <p className="col-span-2 text-sm text-destructive">{state.error}</p>}

      <div className="col-span-2 flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add guest"}
        </Button>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function EditGuestForm({
  guest,
}: {
  guest: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    id_proof_type: string | null;
    id_proof_number: string | null;
    address: string | null;
    notes: string | null;
  };
}) {
  const [state, formAction, pending] = useActionState(updateGuest, INITIAL_STATE);

  return (
    <form action={formAction} className="grid max-w-lg grid-cols-2 gap-3">
      <input type="hidden" name="guestId" value={guest.id} />
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="e-name">Name</Label>
        <Input id="e-name" name="name" defaultValue={guest.name} required />
      </div>
      <Field id="e-phone" name="phone" label="Phone" defaultValue={guest.phone} />
      <Field id="e-email" name="email" label="Email" type="email" defaultValue={guest.email} />
      <Field id="e-idtype" name="idProofType" label="ID proof type" defaultValue={guest.id_proof_type} />
      <Field id="e-idnum" name="idProofNumber" label="ID proof number" defaultValue={guest.id_proof_number} />
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="e-address">Address</Label>
        <Input id="e-address" name="address" defaultValue={guest.address ?? ""} />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <Label htmlFor="e-notes">Notes</Label>
        <Input id="e-notes" name="notes" defaultValue={guest.notes ?? ""} />
      </div>

      {state.error && <p className="col-span-2 text-sm text-destructive">{state.error}</p>}

      <div className="col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
