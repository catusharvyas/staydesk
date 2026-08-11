// Create, edit, extend, cancel, check-in and check-out reservations.
// See PROJECT.md §1 and §4 (build phase 3).
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { listBookings, listAvailableRooms, listGuests } from "@/lib/queries/bookings";
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

  // Room/guest options for the Edit form — only needed for reserved
  // bookings (the only ones editable), so skip the extra queries for
  // everything else. Fine at single-property data volumes; see reports.ts
  // for the same reasoning on a similar per-row query pattern.
  const reserved = bookings.filter((b) => b.status === "reserved");
  const [guests, roomOptionsByBooking] = await Promise.all([
    reserved.length > 0 ? listGuests(property.id) : Promise.resolve([]),
    Promise.all(
      reserved.map((b) =>
        listAvailableRooms(property.id, b.check_in_planned, b.check_out_planned, b.id)
      )
    ),
  ]);
  const roomsByBookingId = new Map(
    reserved.map((b, i) => [
      b.id,
      roomOptionsByBooking[i].map((r) => ({ id: r.id, number: r.number, typeName: r.room_types?.name ?? "" })),
    ])
  );

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
                <BookingRowActions
                  bookingId={b.id}
                  status={b.status}
                  currentGuestId={b.guest_id}
                  currentRoomId={b.room_id}
                  guests={guests}
                  rooms={roomsByBookingId.get(b.id) ?? []}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
