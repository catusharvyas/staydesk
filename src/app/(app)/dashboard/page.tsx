// Dashboard — today's occupancy, arrivals, departures, available rooms and
// rooms requiring cleaning, plus a month occupancy calendar. See PROJECT.md
// §1 and §6 (build phase 2), and §10 for the month-view write-up.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { getDashboardStats, getMonthOccupancy, listTodayArrivals } from "@/lib/queries/dashboard";
import { MonthCalendar, OccupancyLegend } from "./month-calendar";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const params = await searchParams;
  const tab = params.tab === "month" ? "month" : "today";

  const now = new Date();
  // Both tabs' tab-switch links need a stable ?y=&m=, so a viewer who
  // switches to Month always lands on the actual current month rather
  // than whatever they last navigated to and then bounced away from.
  const year = Number(params.y) || now.getFullYear();
  const month = Number(params.m) || now.getMonth() + 1;

  const [stats, arrivals, monthDays] = await Promise.all([
    getDashboardStats(property.id),
    listTodayArrivals(property.id),
    tab === "month" ? getMonthOccupancy(property.id, year, month) : Promise.resolve(null),
  ]);

  const cards = [
    { label: "Occupied", value: stats.occupied },
    { label: "Available", value: stats.available },
    { label: "Arrivals", value: stats.arrivals },
    { label: "Departures", value: stats.departures },
  ];

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
    }`;

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {property.name} — operational summary.
      </p>

      <div className="mt-4 flex w-fit gap-1 rounded-lg border p-1">
        <Link href="/dashboard?tab=today" className={tabClass(tab === "today")}>
          Today
        </Link>
        <Link
          href={`/dashboard?tab=month&y=${year}&m=${month}`}
          className={tabClass(tab === "month")}
        >
          Month
        </Link>
      </div>

      {tab === "today" ? (
        <>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((s) => (
              <div key={s.label} className="rounded-lg border p-4">
                <div className="text-2xl font-semibold">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-medium text-muted-foreground">
              Today&apos;s arrivals
            </h2>
            {arrivals.length === 0 ? (
              <div className="mt-2 rounded-lg border p-4 text-sm text-muted-foreground">
                No arrivals today.
              </div>
            ) : (
              <ul className="mt-2 divide-y rounded-lg border">
                {arrivals.map((b) => (
                  <li key={b.id} className="p-3 text-sm">
                    {b.rooms?.number} — {b.guests?.name}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <div className="mt-4 rounded-lg border p-4">
          <MonthCalendar year={year} month={month} days={monthDays ?? []} />
          <OccupancyLegend />
        </div>
      )}
    </div>
  );
}
