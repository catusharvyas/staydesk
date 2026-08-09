// Create, edit, extend, cancel, check-in and check-out reservations.
// See PROJECT.md §1 and §4 (build phase 3).
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { listBookings } from "@/lib/queries/bookings";
import { BookingRowActions } from "./booking-actions-inline";

const STATUS_LABEL: Record<string, string> = {
  reserved: "Reserved",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
};

export default async function BookingsPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const bookings = await listBookings(property.id);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Bookings</h1>
        <Link
          href="/bookings/new"
          className="rounded-md bg-foreground px-3 py-1.5 text-sm text-background"
        >
          + New booking
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
          No bookings yet.
        </div>
      ) : (
        <ul className="mt-4 divide-y rounded-lg border">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
              <div>
                <div className="font-medium">
                  {b.rooms?.number} — {b.guests?.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {b.check_in_planned} → {b.check_out_planned} · {STATUS_LABEL[b.status]}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {b.status === "checked_out" && (
                  <Link href={`/bookings/${b.id}/invoice`} className="text-xs underline">
                    Invoice
                  </Link>
                )}
                <BookingRowActions bookingId={b.id} status={b.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
