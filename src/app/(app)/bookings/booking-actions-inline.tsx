"use client";

import { useState } from "react";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  checkInBooking,
  checkOutBooking,
  cancelBooking,
  type BookingActionState,
} from "./actions";
import { EditBookingForm } from "./edit-booking-form";

const INITIAL_STATE: BookingActionState = { error: null };

function ActionForm({
  action,
  bookingId,
  label,
}: {
  action: (state: BookingActionState, formData: FormData) => Promise<BookingActionState>;
  bookingId: string;
  label: string;
}) {
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "…" : label}
      </Button>
      {state.error && <span className="text-xs text-destructive">{state.error}</span>}
    </form>
  );
}

export function BookingRowActions({
  bookingId,
  status,
  currentGuestId,
  currentRoomId,
  guests,
  rooms,
}: {
  bookingId: string;
  status: string;
  currentGuestId: string;
  currentRoomId: string;
  guests: { id: string; name: string; phone: string | null }[];
  rooms: { id: string; number: string; typeName: string }[];
}) {
  const [editing, setEditing] = useState(false);

  if (status === "reserved") {
    if (editing) {
      return (
        <div className="w-full">
          <EditBookingForm
            bookingId={bookingId}
            currentGuestId={currentGuestId}
            currentRoomId={currentRoomId}
            guests={guests}
            rooms={rooms}
            onClose={() => setEditing(false)}
          />
        </div>
      );
    }
    return (
      <div className="flex gap-2">
        <ActionForm action={checkInBooking} bookingId={bookingId} label="Check in" />
        <Button type="button" size="sm" variant="outline" onClick={() => setEditing(true)}>
          Edit
        </Button>
        <ActionForm action={cancelBooking} bookingId={bookingId} label="Cancel" />
      </div>
    );
  }
  if (status === "checked_in") {
    return <ActionForm action={checkOutBooking} bookingId={bookingId} label="Check out" />;
  }
  return null;
}
