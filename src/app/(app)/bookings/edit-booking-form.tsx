"use client";

import { useActionState, useState, useEffect } from "react";
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
import { editBooking, type BookingActionState } from "./actions";

const INITIAL_STATE: BookingActionState = { error: null };
const NEW_GUEST = "__new__";

/**
 * Fix a wrong guest/room on a reserved booking — the "edit" gap noted post-
 * V1 (only dates were editable, via Extend Stay). Same guest select-or-
 * quick-add and room-select pattern as bookings/new/booking-form.tsx.
 *
 * Open/closed is owned by the parent (BookingRowActions) — this always
 * renders the form when mounted, and calls onClose on Cancel or once a
 * save actually succeeds (revalidatePath will have refreshed the row's
 * data by then).
 */
export function EditBookingForm({
  bookingId,
  currentGuestId,
  currentRoomId,
  guests,
  rooms,
  onClose,
}: {
  bookingId: string;
  currentGuestId: string;
  currentRoomId: string;
  guests: { id: string; name: string; phone: string | null }[];
  rooms: { id: string; number: string; typeName: string }[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(editBooking, INITIAL_STATE);
  const [guestId, setGuestId] = useState(currentGuestId);

  useEffect(() => {
    if (state !== INITIAL_STATE && !state.error) onClose();
  }, [state, onClose]);

  const guestItems: Record<string, string> = {
    [NEW_GUEST]: "+ New guest",
    ...Object.fromEntries(guests.map((g) => [g.id, g.phone ? `${g.name} (${g.phone})` : g.name])),
  };
  const roomItems = Object.fromEntries(rooms.map((r) => [r.id, `${r.number} · ${r.typeName}`]));

  return (
    <form
      action={formAction}
      className="flex w-full flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Guest</Label>
        <Select
          name="guestId"
          items={guestItems}
          value={guestId}
          onValueChange={(v) => setGuestId(String(v))}
        >
          <SelectTrigger className="h-9 w-48">
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
        <>
          <div className="flex flex-col gap-1">
            <Label htmlFor="eb-name" className="text-xs">Name</Label>
            <Input id="eb-name" name="guestName" required className="h-9 w-32" />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="eb-phone" className="text-xs">Phone</Label>
            <Input id="eb-phone" name="guestPhone" className="h-9 w-32" />
          </div>
        </>
      )}

      <div className="flex flex-col gap-1">
        <Label className="text-xs">Room</Label>
        <Select name="roomId" items={roomItems} defaultValue={currentRoomId} required>
          <SelectTrigger className="h-9 w-40">
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

      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onClose}>
        Cancel
      </Button>
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
