// Real downloadable PDF invoice — closes the "invoices aren't real PDFs"
// gap (PROJECT.md §6/§10 previously noted the invoice page as print-
// friendly HTML only, invoices.pdf_url unpopulated). @react-pdf/renderer
// runs server-side with no headless browser needed, which matters on
// Vercel (a Puppeteer/Playwright approach would need a Chromium binary
// that doesn't fit serverless function size limits without extra tooling).
//
// Content/order mirrors the existing HTML invoice page
// (bookings/[bookingId]/invoice/page.tsx) deliberately — this should read
// as "the same invoice as a file", not a redesign.
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#111111" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  propertyName: { fontSize: 14, fontWeight: 700 },
  muted: { color: "#666666" },
  invoiceTitle: { fontSize: 12, fontWeight: 700, textAlign: "right" },
  section: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  sectionLabel: { fontSize: 8, color: "#666666", marginBottom: 2, textTransform: "uppercase" },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#cccccc",
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableRow: { flexDirection: "row", paddingVertical: 2 },
  colDesc: { flex: 1 },
  colAmount: { width: 80, textAlign: "right" },
  totals: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#cccccc", paddingTop: 8 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  strong: { fontWeight: 700 },
  disclaimer: { marginTop: 24, fontSize: 8, color: "#999999" },
});

function money(n: number) {
  const sign = n < 0 ? "-" : "";
  return `${sign}Rs ${Math.abs(n).toFixed(2)}`;
}

export type InvoicePdfProps = {
  property: { name: string; address: string | null; gstin: string | null };
  invoiceNumber: string;
  issuedAt: string;
  guest: { name: string; phone: string | null; email: string | null };
  room: { number: string; typeName: string | null };
  checkIn: string;
  checkOut: string;
  nights: number;
  roomCharge: number;
  charges: { description: string; amount: number; taxable: boolean }[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  grandTotal: number;
  payments: { amount: number; mode: string; reference: string | null; receivedAt: string }[];
  paidTotal: number;
  balance: number;
};

function InvoiceDocument(props: InvoicePdfProps) {
  const { property, guest, room } = props;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.propertyName}>{property.name}</Text>
            {property.address && <Text style={styles.muted}>{property.address}</Text>}
            {property.gstin && <Text style={styles.muted}>GSTIN: {property.gstin}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceTitle}>Tax Invoice</Text>
            <Text style={styles.muted}>{props.invoiceNumber}</Text>
            <Text style={styles.muted}>{new Date(props.issuedAt).toLocaleDateString()}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View>
            <Text style={styles.sectionLabel}>Billed to</Text>
            <Text>{guest.name}</Text>
            {guest.phone && <Text style={styles.muted}>{guest.phone}</Text>}
            {guest.email && <Text style={styles.muted}>{guest.email}</Text>}
          </View>
          <View>
            <Text style={styles.sectionLabel}>Stay</Text>
            <Text>
              Room {room.number}
              {room.typeName ? ` · ${room.typeName}` : ""}
            </Text>
            <Text style={styles.muted}>
              {props.checkIn} {"→"} {props.checkOut}
            </Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colAmount}>Amount</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.colDesc}>Room charge ({props.nights} nights)</Text>
          <Text style={styles.colAmount}>{money(props.roomCharge)}</Text>
        </View>
        {props.charges.map((c, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.colDesc}>
              {c.description}
              {!c.taxable && " (non-taxable)"}
            </Text>
            <Text style={styles.colAmount}>{money(c.amount)}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalsRow}>
            <Text>Taxable value</Text>
            <Text>{money(props.taxableValue)}</Text>
          </View>
          {props.cgst > 0 && (
            <View style={styles.totalsRow}>
              <Text>CGST</Text>
              <Text>{money(props.cgst)}</Text>
            </View>
          )}
          {props.sgst > 0 && (
            <View style={styles.totalsRow}>
              <Text>SGST</Text>
              <Text>{money(props.sgst)}</Text>
            </View>
          )}
          {props.igst > 0 && (
            <View style={styles.totalsRow}>
              <Text>IGST</Text>
              <Text>{money(props.igst)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.strong}>Grand total</Text>
            <Text style={styles.strong}>{money(props.grandTotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>Paid</Text>
            <Text>{money(-props.paidTotal)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.strong}>Balance due</Text>
            <Text style={styles.strong}>{money(props.balance)}</Text>
          </View>
        </View>

        {props.payments.length > 0 && (
          <View style={{ marginTop: 16 }}>
            <Text style={styles.sectionLabel}>Payments received</Text>
            {props.payments.map((p, i) => (
              <Text key={i} style={styles.muted}>
                {money(p.amount)} {"·"} {p.mode.replace("_", " ")}
                {p.reference ? ` · ${p.reference}` : ""} {"·"}{" "}
                {new Date(p.receivedAt).toLocaleDateString()}
              </Text>
            ))}
          </View>
        )}

        <Text style={styles.disclaimer}>
          This is an application-design illustration — validate against the GST rules applicable
          to this property and transaction date before relying on it in production.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderInvoicePdf(props: InvoicePdfProps): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument {...props} />);
}
