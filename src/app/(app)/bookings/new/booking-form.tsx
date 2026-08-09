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
import { createBooking, type BookingActionState } from "../actions";

const INITIAL_STATE: BookingActionState = { error: null };
const NEW_GUEST = "__new__";

export function BookingForm({
  checkIn,
  checkOut,
  rooms,
  guests,
}: {
  checkIn: string;
  checkOut: string;
  rooms: { id: string; number: string; typeName: string }[];
  guests: { id: string; name: string; phone: string | null }[];
}) {
  const [state, formAction, pending] = useActionState(createBooking, INITIAL_STATE);
  const [guestId, setGuestId] = useState<string>(guests.length === 0 ? NEW_GUEST : "");

  const guestItems: Record<string, string> = {
    [NEW_GUEST]: "+ New guest",
    ...Object.fromEntries(guests.map((g) => [g.id, g.phone ? `${g.name} (${g.phone})` : g.name])),
  };
  const roomItems = Object.fromEntries(rooms.map((r) => [r.id, `${r.number} · ${r.typeName}`]));

  return (
    <form action={formAction} className="flex max-w-sm flex-col gap-4">
      <input type="hidden" name="checkInPlanned" value={checkIn} />
      <input type="hidden" name="checkOutPlanned" value={checkOut} />

      <div className="flex flex-col gap-1.5">
        <Label>Guest</Label>
        <Select
          name="guestId"
          items={guestItems}
          value={guestId}
          onValueChange={(v) => setGuestId(String(v))}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select guest" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NEW_GUEST}>+ New guest</SelectItem>
            {guests.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.phone ? `${g.name} (${g.phone})` : g.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {guestId === NEW_GUEST && (
        <div className="flex flex-col gap-3 rounded-md border p-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guestName">Name</Label>
            <Input id="guestName" name="guestName" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="guestPhone">Phone</Label>
            <Input id="guestPhone" name="guestPhone" />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Room</Label>
        <Select name="roomId" items={roomItems} required>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select room" />
          </SelectTrigger>
          <SelectContent>
            {rooms.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.number} · {r.typeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create booking"}
      </Button>
    </form>
  );
}
