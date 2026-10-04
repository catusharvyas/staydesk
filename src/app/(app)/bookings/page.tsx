// Create, edit, extend, cancel, check-in and check-out reservations.
// See PROJECT.md §1 and §4 (build phase 3).
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarCheck, FileText, Plus } from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { EmptyState, SurfaceList } from "@/components/page/surface";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentProperty } from "@/lib/property";
import { listBookings, listAvailableRooms, listGuests } from "@/lib/queries/bookings";
import { BookingRowActions } from "./booking-actions-inline";

const STATUS_LABEL: Record<string, string> = {
  reserved: "Reserved",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
};

const STATUS_CHIP: Record<string, string> = {
  reserved: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  checked_in: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  checked_out: "bg-green-500/12 text-green-700 dark:text-green-400",
  cancelled: "bg-slate-500/12 text-slate-600 dark:text-slate-400",
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
    <div className="p-4 md:p-8">
      <PageHeader
        title="Bookings"
        action={
          <Link href="/bookings/new" className={buttonVariants()}>
            <Plus /> New booking
          </Link>
        }
      />

      {bookings.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={CalendarCheck}
          title="No bookings yet"
          hint="Create a booking to reserve a room for a guest."
        />
      ) : (
        <SurfaceList className="mt-5">
          {bookings.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {b.rooms?.number}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{b.guests?.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CHIP[b.status] ?? ""}`}
                    >
                      {STATUS_LABEL[b.status]}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {b.check_in_planned} <ArrowRight className="size-3" /> {b.check_out_planned}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {b.status === "checked_out" && (
                  <Link
                    href={`/bookings/${b.id}/invoice`}
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    <FileText /> Invoice
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
        </SurfaceList>
      )}
    </div>
  );
}
