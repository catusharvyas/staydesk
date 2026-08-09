"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { generateInvoiceAction, type InvoiceActionState } from "./actions";

const INITIAL_STATE: InvoiceActionState = { error: null };

export function GenerateInvoiceButton({ bookingId }: { bookingId: string }) {
  const [state, formAction, pending] = useActionState(generateInvoiceAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col items-start gap-1">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button type="submit" disabled={pending}>
        {pending ? "Generating…" : "Generate invoice"}
      </Button>
      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function PrintButton() {
  return (
    <Button variant="outline" onClick={() => window.print()} className="print:hidden">
      Print
    </Button>
  );
}
