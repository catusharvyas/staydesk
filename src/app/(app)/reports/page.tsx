// Keep reporting operational: daily revenue by payment mode, occupancy,
// arrivals/departures, outstanding guest balances, taxable sales and GST
// summary (PROJECT.md §7). More advanced analytics can come later.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import {
  getRevenueByMode,
  getGstSummary,
  getArrivalsDepartures,
  getOccupancySnapshot,
  getOutstandingBalances,
} from "@/lib/queries/reports";

const PAYMENT_MODE_LABEL: Record<string, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Card",
  bank_transfer: "Bank transfer",
};

const ROOM_STATUS_LABEL: Record<string, string> = {
  available: "Available",
  occupied: "Occupied",
  reserved: "Reserved",
  cleaning: "Cleaning",
  maintenance: "Maintenance",
};

function firstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: PageProps<"/reports">) {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const params = await searchParams;
  const from = typeof params.from === "string" && params.from ? params.from : firstOfMonth();
  const to = typeof params.to === "string" && params.to ? params.to : today();

  const [revenue, gst, arrivalsDepartures, occupancy, outstanding] = await Promise.all([
    getRevenueByMode(property.id, from, to),
    getGstSummary(property.id, from, to),
    getArrivalsDepartures(property.id, from, to),
    getOccupancySnapshot(property.id),
    getOutstandingBalances(property.id),
  ]);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Payments &amp; Reports</h1>
        <div className="flex flex-wrap gap-3">
          <Link href="/settings/property" className="text-sm underline">
            Property details →
          </Link>
          <Link href="/settings/tax" className="text-sm underline">
            Tax settings →
          </Link>
        </div>
      </div>

      <form method="get" className="mt-4 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="from" className="text-xs text-muted-foreground">From</label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="h-9 rounded-md border px-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="to" className="text-xs text-muted-foreground">To</label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="h-9 rounded-md border px-2 text-sm"
          />
        </div>
        <button type="submit" className="h-9 rounded-md border px-3 text-sm">
          Apply
        </button>
      </form>

      {/* Occupancy is a live snapshot, not date-ranged — "how many rooms are
          occupied right now" doesn't have a historical range meaning yet
          without room-night tracking, which isn't built. */}
      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">Occupancy (current)</h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(ROOM_STATUS_LABEL).map(([status, label]) => (
            <div key={status} className="rounded-lg border p-3">
              <div className="text-xl font-semibold">{occupancy[status] ?? 0}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Arrivals &amp; departures ({from} → {to})
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:w-64">
          <div className="rounded-lg border p-3">
            <div className="text-xl font-semibold">{arrivalsDepartures.arrivals}</div>
            <div className="text-xs text-muted-foreground">Arrivals</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-xl font-semibold">{arrivalsDepartures.departures}</div>
            <div className="text-xs text-muted-foreground">Departures</div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Revenue by payment mode ({from} → {to})
        </h2>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(PAYMENT_MODE_LABEL).map(([mode, label]) => (
            <div key={mode} className="rounded-lg border p-3">
              <div className="text-xl font-semibold">₹{revenue.byMode[mode as keyof typeof revenue.byMode].toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Total: ₹{revenue.total.toFixed(2)}</p>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">
          Taxable sales &amp; GST summary ({from} → {to})
        </h2>
        <dl className="mt-2 flex max-w-xs flex-col gap-1 text-sm">
          <Row label="Invoices" value={gst.count} isCount />
          <Row label="Taxable value" value={gst.taxableValue} />
          <Row label="CGST" value={gst.cgst} />
          <Row label="SGST" value={gst.sgst} />
          <Row label="IGST" value={gst.igst} />
          <Row label="Total" value={gst.total} strong />
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">Outstanding balances</h2>
        {outstanding.length === 0 ? (
          <div className="mt-2 rounded-lg border p-4 text-sm text-muted-foreground">
            No outstanding balances.
          </div>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {outstanding.map((o) => (
              <li key={o.bookingId} className="flex justify-between p-3 text-sm">
                <span>
                  Room {o.roomNumber} — {o.guestName}
                </span>
                <span className="font-medium">₹{o.balance.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  strong,
  isCount,
}: {
  label: string;
  value: number;
  strong?: boolean;
  isCount?: boolean;
}) {
  return (
    <div className={`flex justify-between ${strong ? "font-medium" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd>{isCount ? value : `₹${value.toFixed(2)}`}</dd>
    </div>
  );
}
