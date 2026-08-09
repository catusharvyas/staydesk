// Room detail: guest, stay, charges, payments and operational actions
// (Receive Payment, Extend Stay, Check Out) — see PROJECT.md §2/§3/§4.
// Next.js 16: `params` is a Promise and must be awaited (async Request APIs).
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { getRoomWithType, listRoomTypes } from "@/lib/queries/rooms";
import { getActiveBookingForRoom } from "@/lib/queries/bookings";
import { getBookingCharges, getPayments, getTaxSettings } from "@/lib/queries/pricing";
import { calculateBookingPricing, nightsBetween } from "@/lib/pricing";
import { CheckInButton, CheckOutButton, ExtendStayForm } from "./room-actions";
import { AddChargeForm, RateDiscountForm, RecordPaymentForm } from "./pricing-forms";
import { EditRoomForm } from "./edit-room-form";

export default async function RoomDetailPage({
  params,
}: PageProps<"/rooms/[roomId]">) {
  const { roomId } = await params;

  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const room = await getRoomWithType(property.id, roomId);
  if (!room) notFound();

  const canManage = property.role === "owner" || property.role === "admin";
  const roomTypes = canManage ? await listRoomTypes(property.id) : [];

  const booking = await getActiveBookingForRoom(property.id, roomId);

  let pricing = null;
  let charges: Awaited<ReturnType<typeof getBookingCharges>> = [];
  let payments: Awaited<ReturnType<typeof getPayments>> = [];
  if (booking) {
    const taxSettings = await getTaxSettings(property.id);
    [charges, payments] = await Promise.all([
      getBookingCharges(booking.id),
      getPayments(booking.id),
    ]);

    if (taxSettings) {
      const ratePerNight = booking.rate_override ?? room.room_types?.base_rate ?? 0;
      const nights = nightsBetween(booking.check_in_planned, booking.check_out_planned);
      pricing = calculateBookingPricing({
        nights,
        ratePerNight,
        discount: booking.discount,
        charges: charges.map((c) => ({ amount: c.amount, taxable: c.taxable })),
        taxSettings,
      });
    }
  }

  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = pricing ? Math.max(0, pricing.grandTotal - paidTotal) : 0;

  return (
    <div className="p-4 md:p-6">
      <Link
        href="/rooms"
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Rooms
      </Link>

      <h1 className="mt-2 text-xl font-semibold">Room {room.number}</h1>
      <p className="mt-1 text-sm uppercase text-muted-foreground">
        {room.status} · {room.room_types?.name}
        {room.room_types?.base_rate != null &&
          ` · ₹${room.room_types.base_rate}/night`}
      </p>

      {canManage && (
        <div className="mt-3">
          <EditRoomForm
            room={{ id: room.id, number: room.number, floor: room.floor, room_type_id: room.room_type_id }}
            roomTypes={roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))}
          />
        </div>
      )}

      {booking ? (
        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-lg border p-4">
            <div className="font-medium">{booking.guests?.name}</div>
            {booking.guests?.phone && (
              <div className="text-sm text-muted-foreground">{booking.guests.phone}</div>
            )}
            <div className="mt-2 text-sm">
              {booking.status === "checked_in" ? "Checked in" : "Reserved"}:{" "}
              {booking.check_in_planned} → {booking.check_out_planned}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <RecordPaymentForm bookingId={booking.id} />
              {booking.status === "reserved" && <CheckInButton bookingId={booking.id} />}
              {booking.status === "checked_in" && (
                <>
                  <ExtendStayForm bookingId={booking.id} currentCheckOut={booking.check_out_planned} />
                  <CheckOutButton bookingId={booking.id} />
                </>
              )}
            </div>
          </div>

          {pricing && (
            <div className="rounded-lg border p-4">
              <h2 className="text-sm font-medium text-muted-foreground">Pricing</h2>

              <div className="mt-3">
                <RateDiscountForm
                  bookingId={booking.id}
                  rateOverride={booking.rate_override}
                  discount={booking.discount}
                />
              </div>

              <dl className="mt-4 flex flex-col gap-1 text-sm">
                <Row label="Room charge" value={pricing.roomCharge} />
                {charges.map((c) => (
                  <Row
                    key={c.id}
                    label={`${c.description}${c.taxable ? "" : " (non-taxable)"}`}
                    value={c.amount}
                  />
                ))}
                <Row label="Taxable value" value={pricing.taxableValue} strong />
                {pricing.gstRate > 0 &&
                  (pricing.cgst > 0 ? (
                    <>
                      <Row label={`CGST (${(pricing.gstRate / 2).toFixed(1)}%)`} value={pricing.cgst} />
                      <Row label={`SGST (${(pricing.gstRate / 2).toFixed(1)}%)`} value={pricing.sgst} />
                    </>
                  ) : (
                    <Row label={`IGST (${pricing.gstRate}%)`} value={pricing.igst} />
                  ))}
                <Row label="Grand total" value={pricing.grandTotal} strong />
                <Row label="Paid" value={-paidTotal} />
                <Row label="Balance" value={balance} strong />
              </dl>

              <div className="mt-4">
                <AddChargeForm bookingId={booking.id} />
              </div>

              {payments.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-medium text-muted-foreground">Payments</h3>
                  <ul className="mt-1 flex flex-col gap-1 text-sm">
                    {payments.map((p) => (
                      <li key={p.id}>
                        ₹{p.amount} · {p.mode.replace("_", " ")}
                        {p.reference && ` · ${p.reference}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <p className="mt-4 text-sm text-muted-foreground">
          No active stay for this room.{" "}
          <Link href="/bookings/new" className="underline">
            Create a booking
          </Link>
          .
        </p>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  const sign = value < 0 ? "-" : "";
  return (
    <div className={`flex justify-between ${strong ? "font-medium" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd>{sign}₹{Math.abs(value).toFixed(2)}</dd>
    </div>
  );
}
