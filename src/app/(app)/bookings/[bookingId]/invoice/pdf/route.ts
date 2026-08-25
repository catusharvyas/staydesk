// Downloadable PDF for an already-generated invoice — only ever renders
// the frozen stored `invoices` row (same "a generated invoice is a
// snapshot" rule as the HTML invoice page), never a live pre-generation
// preview. Node runtime explicitly, not edge — @react-pdf/renderer's
// layout engine isn't edge-safe.
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getCurrentProperty } from "@/lib/property";
import { getInvoiceByBooking, getInvoiceDetails } from "@/lib/queries/invoices";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { nightsBetween } from "@/lib/pricing";
import { logoPublicUrl } from "@/lib/property-logo";

/**
 * Fetches the brand logo's bytes so react-pdf never has to fetch it itself
 * mid-render. Any failure returns null — an invoice without a logo is a
 * perfectly valid invoice, whereas a logo problem that throws would deny
 * the guest their bill entirely.
 */
async function loadLogo(
  logoPath: string | null
): Promise<{ data: Buffer; format: "png" | "jpg" } | null> {
  const url = logoPublicUrl(logoPath);
  if (!url) return null;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    const format = type.includes("png") ? "png" : type.includes("jpeg") ? "jpg" : null;
    if (!format) return null;
    return { data: Buffer.from(await res.arrayBuffer()), format };
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  const property = await getCurrentProperty();
  if (!property) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const invoice = await getInvoiceByBooking(property.id, bookingId);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not generated yet." }, { status: 404 });
  }

  const booking = await getInvoiceDetails(property.id, bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const paidTotal = booking.payments.reduce((sum, p) => sum + p.amount, 0);
  const nights = nightsBetween(booking.check_in_planned, booking.check_out_planned);
  const taxableCharges = booking.booking_charges
    .filter((c) => c.taxable)
    .reduce((sum, c) => sum + c.amount, 0);
  const roomCharge = invoice.taxable_value - taxableCharges;

  const logo = await loadLogo(property.logo_path);

  const pdfBuffer = await renderInvoicePdf({
    property: {
      name: property.name,
      legalName: property.legal_name,
      address: property.address,
      gstin: property.gstin,
      pan: property.pan,
      cin: property.cin,
    },
    logo,
    invoiceNumber: invoice.invoice_number,
    issuedAt: invoice.issued_at,
    guest: {
      name: booking.guests?.name ?? "",
      phone: booking.guests?.phone ?? null,
      email: booking.guests?.email ?? null,
    },
    room: {
      number: booking.rooms?.number ?? "",
      typeName: booking.rooms?.room_types?.name ?? null,
    },
    checkIn: booking.check_in_planned,
    checkOut: booking.check_out_planned,
    nights,
    roomCharge,
    charges: booking.booking_charges.map((c) => ({
      description: c.description,
      amount: c.amount,
      taxable: c.taxable,
    })),
    taxableValue: invoice.taxable_value,
    cgst: invoice.cgst,
    sgst: invoice.sgst,
    igst: invoice.igst,
    grandTotal: invoice.total,
    payments: booking.payments.map((p) => ({
      amount: p.amount,
      mode: p.mode,
      reference: p.reference,
      receivedAt: p.received_at,
    })),
    paidTotal,
    balance: Math.max(0, invoice.total - paidTotal),
  });

  // Buffer isn't directly assignable to BodyInit under these type
  // declarations (even though it's a valid Uint8Array at runtime) — wrap
  // explicitly rather than widen the type some other way.
  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
