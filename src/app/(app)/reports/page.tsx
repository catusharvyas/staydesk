// Keep reporting operational: daily revenue by payment mode, occupancy,
// arrivals/departures, outstanding guest balances, taxable sales and GST
// summary (PROJECT.md §7). More advanced analytics can come later.
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  CreditCard,
  Landmark,
  LogIn,
  LogOut,
  Receipt,
  Settings,
  Smartphone,
} from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/page/page-header";
import { EmptyState, StatCard, Surface, SurfaceList } from "@/components/page/surface";
import { buttonVariants } from "@/components/ui/button";
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

const PAYMENT_MODE_ICON = {
  cash: Banknote,
  upi: Smartphone,
  card: CreditCard,
  bank_transfer: Landmark,
};

const ROOM_STATUS: Record<string, { label: string; dot: string }> = {
  available: { label: "Available", dot: "bg-green-500" },
  occupied: { label: "Occupied", dot: "bg-blue-500" },
  reserved: { label: "Reserved", dot: "bg-amber-500" },
  cleaning: { label: "Cleaning", dot: "bg-slate-400" },
  maintenance: { label: "Maintenance", dot: "bg-red-500" },
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
    <div className="p-4 md:p-8">
      <PageHeader
        title="Payments & Reports"
        action={
          <>
            <Link href="/settings/property" className={buttonVariants({ variant: "outline" })}>
              <Settings /> Property
            </Link>
            <Link href="/settings/tax" className={buttonVariants({ variant: "outline" })}>
              <Receipt /> Tax
            </Link>
          </>
        }
      />

      <Surface className="mt-5 p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="from" className="text-xs font-medium text-muted-foreground">From</label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="to" className="text-xs font-medium text-muted-foreground">To</label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="h-9 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <button type="submit" className={buttonVariants()}>
            Apply
          </button>
        </form>
      </Surface>

      {/* Occupancy is a live snapshot, not date-ranged — "how many rooms are
          occupied right now" doesn't have a historical range meaning yet
          without room-night tracking, which isn't built. */}
      <section className="mt-8">
        <SectionTitle>Occupancy now</SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(ROOM_STATUS).map(([status, { label, dot }]) => (
            <Surface key={status} className="p-3.5">
              <div className="text-2xl font-semibold tabular-nums tracking-tight">{occupancy[status] ?? 0}</div>
              <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className={`size-2 rounded-full ${dot}`} />
                {label}
              </div>
            </Surface>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>
          Arrivals &amp; departures · {from} <ArrowRight className="inline size-3" /> {to}
        </SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:max-w-md">
          <StatCard label="Arrivals" value={arrivalsDepartures.arrivals} icon={LogIn} tone="primary" />
          <StatCard label="Departures" value={arrivalsDepartures.departures} icon={LogOut} tone="amber" />
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>
          Revenue by payment mode · {from} <ArrowRight className="inline size-3" /> {to}
        </SectionTitle>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(PAYMENT_MODE_LABEL).map(([mode, label]) => (
            <StatCard
              key={mode}
              label={label}
              icon={PAYMENT_MODE_ICON[mode as keyof typeof PAYMENT_MODE_ICON]}
              tone="green"
              value={`₹${revenue.byMode[mode as keyof typeof revenue.byMode].toFixed(2)}`}
            />
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Total <span className="font-semibold text-foreground">₹{revenue.total.toFixed(2)}</span>
        </p>
      </section>

      <section className="mt-8">
        <SectionTitle>
          Taxable sales &amp; GST · {from} <ArrowRight className="inline size-3" /> {to}
        </SectionTitle>
        <Surface className="mt-3 max-w-sm p-4">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Invoices" value={gst.count} isCount />
            <Row label="Taxable value" value={gst.taxableValue} />
            <Row label="CGST" value={gst.cgst} />
            <Row label="SGST" value={gst.sgst} />
            <Row label="IGST" value={gst.igst} />
            <div className="my-1 border-t" />
            <Row label="Total" value={gst.total} strong />
          </dl>
        </Surface>
      </section>

      <section className="mt-8">
        <SectionTitle>Outstanding balances</SectionTitle>
        {outstanding.length === 0 ? (
          <EmptyState className="mt-3" icon={Banknote} title="All settled" hint="No outstanding guest balances." />
        ) : (
          <SurfaceList className="mt-3">
            {outstanding.map((o) => (
              <li key={o.bookingId} className="flex items-center justify-between p-3.5 text-sm">
                <span>
                  <span className="font-medium">Room {o.roomNumber}</span>
                  <span className="text-muted-foreground"> · {o.guestName}</span>
                </span>
                <span className="font-semibold tabular-nums text-red-600 dark:text-red-400">₹{o.balance.toFixed(2)}</span>
              </li>
            ))}
          </SurfaceList>
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
    <div className={`flex justify-between ${strong ? "text-base font-semibold" : "text-muted-foreground"}`}>
      <dt>{label}</dt>
      <dd>{isCount ? value : `₹${value.toFixed(2)}`}</dd>
    </div>
  );
}
