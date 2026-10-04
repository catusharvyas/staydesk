// Recommended mobile booking flow (PROJECT.md §3): Guest -> Stay -> Room ->
// Payment -> Confirm. Payment is Phase 5; this covers Guest/Stay/Room/Confirm.
// Dates are picked first (plain GET form, no client JS needed) so only
// rooms actually available for that range are ever offered — mirrors the
// DB exclusion constraint (0001_init.sql) rather than fighting it.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { BackLink, PageHeader } from "@/components/page/page-header";
import { Surface } from "@/components/page/surface";
import { buttonVariants } from "@/components/ui/button";
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

  const steps = [
    { label: "Stay", done: datesChosen, current: !datesChosen },
    { label: "Guest & room", done: false, current: datesChosen },
  ];
  const dateInput =
    "h-10 rounded-lg border border-input bg-card px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  return (
    <div className="p-4 md:p-8">
      <BackLink href="/bookings">Bookings</BackLink>
      <PageHeader title="New booking" description="Pick the dates first — we'll only show rooms that are free." />

      <ol className="mt-5 flex items-center gap-3 text-sm">
        {steps.map((st, i) => (
          <li key={st.label} className="flex items-center gap-3">
            <span className="flex items-center gap-2">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  st.done
                    ? "bg-primary text-primary-foreground"
                    : st.current
                      ? "bg-primary/12 text-primary ring-1 ring-primary/40"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {st.done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span className={st.current ? "font-medium" : "text-muted-foreground"}>{st.label}</span>
            </span>
            {i < steps.length - 1 && <span className="h-px w-8 bg-border" />}
          </li>
        ))}
      </ol>

      <Surface className="mt-5 max-w-xl p-5">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkIn" className="text-xs font-medium text-muted-foreground">
              Check-in
            </label>
            <input
              id="checkIn"
              name="checkIn"
              type="date"
              defaultValue={checkIn || tomorrow(0)}
              required
              className={dateInput}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="checkOut" className="text-xs font-medium text-muted-foreground">
              Check-out
            </label>
            <input
              id="checkOut"
              name="checkOut"
              type="date"
              defaultValue={checkOut || tomorrow(1)}
              required
              className={dateInput}
            />
          </div>
          <button
            type="submit"
            className={buttonVariants({ variant: datesChosen ? "outline" : "default", size: "lg" })}
          >
            Check availability
          </button>
        </form>
      </Surface>

      {datesChosen && (
        <Surface className="mt-4 max-w-xl p-5">
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rooms available for these dates.{" "}
              <Link href="/rooms" className="font-medium text-primary hover:underline">
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
        </Surface>
      )}
    </div>
  );
}
