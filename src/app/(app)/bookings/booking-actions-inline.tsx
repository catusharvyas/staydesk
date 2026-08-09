"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  checkInBooking,
  checkOutBooking,
  cancelBooking,
  type BookingActionState,
} from "./actions";

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
}: {
  bookingId: string;
  status: string;
}) {
  if (status === "reserved") {
    return (
      <div className="flex gap-2">
        <ActionForm action={checkInBooking} bookingId={bookingId} label="Check in" />
        <ActionForm action={cancelBooking} bookingId={bookingId} label="Cancel" />
      </div>
    );
  }
  if (status === "checked_in") {
    return <ActionForm action={checkOutBooking} bookingId={bookingId} label="Check out" />;
  }
  return <span className="text-xs text-muted-foreground capitalize">{status.replace("_", " ")}</span>;
}
