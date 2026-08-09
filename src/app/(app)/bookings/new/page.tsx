// Recommended mobile booking flow (PROJECT.md §3): Guest -> Stay -> Room ->
// Payment -> Confirm. Payment is Phase 5; this covers Guest/Stay/Room/Confirm.
// Dates are picked first (plain GET form, no client JS needed) so only
// rooms actually available for that range are ever offered — mirrors the
// DB exclusion constraint (0001_init.sql) rather than fighting it.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { listAvailableRooms } from "@/lib/queries/bookings";
import { listGuests } from "@/lib/queries/bookings";
import { BookingForm } from "./booking-form";

function tomorrow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function NewBookingPage({
  searchParams,
}: PageProps<"/bookings/new">) {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const params = await searchParams;
  const checkIn = typeof params.checkIn === "string" ? params.checkIn : "";
  const checkOut = typeof params.checkOut === "string" ? params.checkOut : "";
  const datesChosen = Boolean(checkIn && checkOut && checkOut > checkIn);

  const [rooms, guests] = await Promise.all([
    datesChosen ? listAvailableRooms(property.id, checkIn, checkOut) : Promise.resolve([]),
    listGuests(property.id),
  ]);

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold">New booking</h1>

      <ol className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
        <li className={!datesChosen ? "font-medium text-foreground" : ""}>1. Stay</li>
        <span>→</span>
        <li className={datesChosen ? "font-medium text-foreground" : ""}>2. Guest &amp; Room</li>
        <span>→</span>
        <li>3. Confirm</li>
      </ol>

      <form method="get" className="mt-6 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="checkIn" className="text-xs text-muted-foreground">
            Check-in
          </label>
          <input
            id="checkIn"
            name="checkIn"
            type="date"
            defaultValue={checkIn || tomorrow(0)}
            required
            className="h-9 rounded-md border px-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="checkOut" className="text-xs text-muted-foreground">
            Check-out
          </label>
          <input
            id="checkOut"
            name="checkOut"
            type="date"
            defaultValue={checkOut || tomorrow(1)}
            required
            className="h-9 rounded-md border px-2 text-sm"
          />
        </div>
        <button type="submit" className="h-9 rounded-md border px-3 text-sm">
          Check availability
        </button>
      </form>

      {datesChosen && (
        <div className="mt-6">
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rooms available for these dates.{" "}
              <Link href="/rooms" className="underline">
                Add more rooms
              </Link>{" "}
              or try different dates.
            </p>
          ) : (
            <BookingForm
              checkIn={checkIn}
              checkOut={checkOut}
              rooms={rooms.map((r) => ({ id: r.id, number: r.number, typeName: r.room_types?.name ?? "" }))}
              guests={guests}
            />
          )}
        </div>
      )}
    </div>
  );
}
