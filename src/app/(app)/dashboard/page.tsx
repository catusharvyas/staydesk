// Dashboard — today's occupancy, arrivals, departures, available rooms and
// rooms requiring cleaning, plus a month occupancy calendar. See PROJECT.md
// §1 and §6 (build phase 2), and §10 for the month-view write-up.
import Link from "next/link";
import { redirect } from "next/navigation";
import { BedDouble, DoorOpen, LogIn, LogOut, CalendarX2 } from "lucide-react";
import { PageHeader, SectionTitle } from "@/components/page/page-header";
import { EmptyState, StatCard, SurfaceList, Surface, type Tone } from "@/components/page/surface";
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
    { label: "Occupied", value: stats.occupied, icon: BedDouble, tone: "blue" },
    { label: "Available", value: stats.available, icon: DoorOpen, tone: "green" },
    { label: "Arrivals today", value: stats.arrivals, icon: LogIn, tone: "primary" },
    { label: "Departures today", value: stats.departures, icon: LogOut, tone: "amber" },
  ] satisfies { label: string; value: number; icon: typeof BedDouble; tone: Tone }[];

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
      active
        ? "bg-card text-foreground shadow-sm ring-1 ring-foreground/8"
        : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="p-4 md:p-8">
      <PageHeader
        title="Dashboard"
        description={`${property.name} — ${now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}`}
      />

      <div className="mt-5 flex w-fit gap-1 rounded-xl bg-muted p-1">
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
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {cards.map((c) => (
              <StatCard key={c.label} {...c} />
            ))}
          </div>

          <section className="mt-8">
            <SectionTitle>Today&apos;s arrivals</SectionTitle>
            {arrivals.length === 0 ? (
              <EmptyState
                className="mt-3"
                icon={CalendarX2}
                title="No arrivals today"
                hint="Guests arriving today will show up here."
              />
            ) : (
              <SurfaceList className="mt-3">
                {arrivals.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 p-3.5 text-sm">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                      {b.rooms?.number}
                    </span>
                    <span className="font-medium">{b.guests?.name}</span>
                  </li>
                ))}
              </SurfaceList>
            )}
          </section>
        </>
      ) : (
        <Surface className="mt-5 p-4 md:p-5">
          <MonthCalendar year={year} month={month} days={monthDays ?? []} />
          <OccupancyLegend />
        </Surface>
      )}
    </div>
  );
}
