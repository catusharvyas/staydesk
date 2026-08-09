"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  checkInBooking,
  checkOutBooking,
  extendStay,
  type BookingActionState,
} from "../../bookings/actions";

const INITIAL_STATE: BookingActionState = { error: null };

export function CheckInButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(checkInBooking, INITIAL_STATE);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Check In"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function CheckOutButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(checkOutBooking, INITIAL_STATE);
  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Check Out"}
      </Button>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function ExtendStayForm({
  bookingId,
  currentCheckOut,
}: {
  bookingId: string;
  currentCheckOut: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(extendStay, INITIAL_STATE);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Extend Stay
      </Button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <div className="flex items-center gap-2">
        <Input
          type="date"
          name="checkOutPlanned"
          defaultValue={currentCheckOut}
          className="h-9 w-40"
        />
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Save"}
        </Button>
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
