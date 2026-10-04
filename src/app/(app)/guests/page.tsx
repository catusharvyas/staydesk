// Guest contact details and stay history. See PROJECT.md §1 (build phase 4).
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/page/page-header";
import { EmptyState, SurfaceList } from "@/components/page/surface";
import { getCurrentProperty } from "@/lib/property";
import { listGuestsWithSearch } from "@/lib/queries/guests";
import { AddGuestForm } from "./guest-forms";

export default async function GuestsPage({
  searchParams,
}: PageProps<"/guests">) {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const guests = await listGuestsWithSearch(property.id, q);

  return (
    <div className="p-4 md:p-8">
      <PageHeader title="Guests" action={<AddGuestForm />} />

      <form method="get" className="relative mt-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or phone"
          className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </form>

      {guests.length === 0 ? (
        <EmptyState
          className="mt-5"
          icon={Users}
          title={q ? `No guests match "${q}"` : "No guests yet"}
          hint={q ? "Try a different name or phone number." : "Add a guest to get started."}
        />
      ) : (
        <SurfaceList className="mt-5">
          {guests.map((g) => (
            <li key={g.id}>
              <Link
                href={`/guests/${g.id}`}
                className="flex items-center gap-3 p-3.5 text-sm transition-colors hover:bg-muted/60"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold uppercase text-primary">
                  {g.name.trim().charAt(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{g.name}</span>
                  <span className="block text-xs text-muted-foreground">{g.phone}</span>
                </span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </SurfaceList>
      )}
    </div>
  );
}
