// Guest contact details and stay history. See PROJECT.md §1 (build phase 4).
import Link from "next/link";
import { redirect } from "next/navigation";
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
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Guests</h1>
        <AddGuestForm />
      </div>

      <form method="get" className="mt-4 max-w-sm">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by name or phone"
          className="h-9 w-full rounded-md border px-3 text-sm"
        />
      </form>

      {guests.length === 0 ? (
        <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
          {q ? `No guests match "${q}".` : "No guests yet."}
        </div>
      ) : (
        <ul className="mt-4 divide-y rounded-lg border">
          {guests.map((g) => (
            <li key={g.id}>
              <Link
                href={`/guests/${g.id}`}
                className="flex items-center justify-between p-3 text-sm hover:bg-muted"
              >
                <span className="font-medium">{g.name}</span>
                <span className="text-muted-foreground">{g.phone}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
