// Tax invoice at checkout — invoice number, guest details, room/stay dates,
// taxable charges, tax components, total, payments received and balance
// (PROJECT.md §6). Reuses src/lib/pricing.ts for any live (pre-generation)
// preview; a generated invoice's stored totals are the frozen source of
// truth from that point on, same as real invoicing.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { getInvoiceByBooking, getInvoiceDetails } from "@/lib/queries/invoices";
import { getTaxSettings } from "@/lib/queries/pricing";
import { calculateBookingPricing, nightsBetween } from "@/lib/pricing";
import { GenerateInvoiceButton, PrintButton } from "./invoice-controls";

export default async function InvoicePage({
  params,
}: PageProps<"/bookings/[bookingId]/invoice">) {
  const { bookingId } = await params;

  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const booking = await getInvoiceDetails(property.id, bookingId);
  if (!booking) notFound();

  const invoice = await getInvoiceByBooking(property.id, bookingId);

  const paidTotal = booking.payments.reduce((sum, p) => sum + p.amount, 0);

  let breakdown: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    grandTotal: number;
  } | null = null;

  if (invoice) {
    breakdown = {
      taxableValue: invoice.taxable_value,
      cgst: invoice.cgst,
      sgst: invoice.sgst,
      igst: invoice.igst,
      grandTotal: invoice.total,
    };
  } else {
    const taxSettings = await getTaxSettings(property.id);
    if (taxSettings) {
      const ratePerNight = booking.rate_override ?? booking.rooms?.room_types?.base_rate ?? 0;
      const nights = nightsBetween(booking.check_in_planned, booking.check_out_planned);
      const pricing = calculateBookingPricing({
        nights,
        ratePerNight,
        discount: booking.discount,
        charges: booking.booking_charges.map((c) => ({ amount: c.amount, taxable: c.taxable })),
        taxSettings,
      });
      breakdown = {
        taxableValue: pricing.taxableValue,
        cgst: pricing.cgst,
        sgst: pricing.sgst,
        igst: pricing.igst,
        grandTotal: pricing.grandTotal,
      };
    }
  }

  const balance = breakdown ? Math.max(0, breakdown.grandTotal - paidTotal) : 0;

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-6 print:p-0">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/bookings" className="text-sm text-muted-foreground hover:underline">
          ← Bookings
        </Link>
        <div className="flex gap-2">
          {invoice && (
            <a
              href={`/bookings/${bookingId}/invoice/pdf`}
              className="inline-flex h-8 items-center rounded-lg border px-2.5 text-sm hover:bg-muted"
            >
              Download PDF
            </a>
          )}
          <PrintButton />
        </div>
      </div>

      <div className="rounded-lg border p-6 print:border-none">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold">{property.name}</h1>
            {property.address && <p className="text-sm text-muted-foreground">{property.address}</p>}
            {property.gstin && <p className="text-sm text-muted-foreground">GSTIN: {property.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="font-medium">Tax Invoice</p>
            {invoice ? (
              <>
                <p className="text-sm text-muted-foreground">{invoice.invoice_number}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(invoice.issued_at).toLocaleDateString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not yet generated</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Billed to</p>
            <p>{booking.guests?.name}</p>
            {booking.guests?.phone && <p className="text-muted-foreground">{booking.guests.phone}</p>}
            {booking.guests?.email && <p className="text-muted-foreground">{booking.guests.email}</p>}
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Stay</p>
            <p>
              Room {booking.rooms?.number} · {booking.rooms?.room_types?.name}
            </p>
            <p className="text-muted-foreground">
              {booking.check_in_planned} → {booking.check_out_planned}
            </p>
          </div>
        </div>

        {breakdown ? (
          <>
            <table className="mt-6 w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-1 font-normal">Description</th>
                  <th className="py-1 text-right font-normal">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1">
                    Room charge ({nightsBetween(booking.check_in_planned, booking.check_out_planned)} nights)
                  </td>
                  <td className="py-1 text-right">
                    ₹{(breakdown.taxableValue - sumTaxable(booking.booking_charges)).toFixed(2)}
                  </td>
                </tr>
                {booking.booking_charges.map((c) => (
                  <tr key={c.id}>
                    <td className="py-1">
                      {c.description}
                      {!c.taxable && " (non-taxable)"}
                    </td>
                    <td className="py-1 text-right">₹{c.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <dl className="mt-4 flex flex-col gap-1 border-t pt-3 text-sm">
              <Row label="Taxable value" value={breakdown.taxableValue} />
              {breakdown.cgst > 0 && <Row label="CGST" value={breakdown.cgst} />}
              {breakdown.sgst > 0 && <Row label="SGST" value={breakdown.sgst} />}
              {breakdown.igst > 0 && <Row label="IGST" value={breakdown.igst} />}
              <Row label="Grand total" value={breakdown.grandTotal} strong />
              <Row label="Paid" value={-paidTotal} />
              <Row label="Balance due" value={balance} strong />
            </dl>

            {booking.payments.length > 0 && (
              <div className="mt-4 text-sm">
                <p className="text-xs font-medium text-muted-foreground">Payments received</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {booking.payments.map((p) => (
                    <li key={p.id}>
                      ₹{p.amount} · {p.mode.replace("_", " ")}
                      {p.reference && ` · ${p.reference}`} ·{" "}
                      {new Date(p.received_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">
            No tax settings configured for this property yet.
          </p>
        )}

        {!invoice && (
          <div className="mt-6 print:hidden">
            <GenerateInvoiceButton bookingId={bookingId} />
          </div>
        )}

        <p className="mt-6 text-xs text-muted-foreground">
          This is an application-design illustration — validate against the
          GST rules applicable to this property and transaction date before
          relying on it in production.
        </p>
      </div>
    </div>
  );
}

function sumTaxable(charges: { amount: number; taxable: boolean }[]) {
  return charges.filter((c) => c.taxable).reduce((sum, c) => sum + c.amount, 0);
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
