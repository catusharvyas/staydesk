// Dashboard — today's occupancy, arrivals, departures, available rooms and
// rooms requiring cleaning. See PROJECT.md §1 and §6 (build phase 2).
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { getDashboardStats, listTodayArrivals } from "@/lib/queries/dashboard";

export default async function DashboardPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const [stats, arrivals] = await Promise.all([
    getDashboardStats(property.id),
    listTodayArrivals(property.id),
  ]);

  const cards = [
    { label: "Occupied", value: stats.occupied },
    { label: "Available", value: stats.available },
    { label: "Arrivals", value: stats.arrivals },
    { label: "Departures", value: stats.departures },
  ];

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {property.name} — today&apos;s operational summary.
      </p>

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
            No arrivals today — bookings land in Phase 3.
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
    </div>
  );
}
