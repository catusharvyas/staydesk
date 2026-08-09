"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProperty } from "@/lib/property";
import { generateInvoiceForBooking } from "@/lib/invoicing";

export type InvoiceActionState = { error: string | null };

// Manual retry path — checkOutBooking generates the invoice automatically
// and best-effort (a failure there must not block checkout); this is how
// front desk recovers if that attempt failed.
export async function generateInvoiceAction(
  _prevState: InvoiceActionState,
  formData: FormData
): Promise<InvoiceActionState> {
  const property = await getCurrentProperty();
  if (!property) return { error: "No property found." };

  const bookingId = String(formData.get("bookingId") ?? "");
  const result = await generateInvoiceForBooking(property.id, bookingId);
  if (result.error) return { error: result.error };

  revalidatePath(`/bookings/${bookingId}/invoice`);
  return { error: null };
}
