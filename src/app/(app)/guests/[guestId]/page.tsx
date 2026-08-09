// Guest detail: editable contact info + full stay history at this property.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { getGuest, getGuestStayHistory } from "@/lib/queries/guests";
import { EditGuestForm } from "../guest-forms";

const STATUS_LABEL: Record<string, string> = {
  reserved: "Reserved",
  checked_in: "Checked in",
  checked_out: "Checked out",
  cancelled: "Cancelled",
};

export default async function GuestDetailPage({
  params,
}: PageProps<"/guests/[guestId]">) {
  const { guestId } = await params;

  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const guest = await getGuest(property.id, guestId);
  if (!guest) notFound();

  const stays = await getGuestStayHistory(property.id, guestId);

  return (
    <div className="p-4 md:p-6">
      <Link href="/guests" className="text-sm text-muted-foreground hover:underline">
        ← Guests
      </Link>

      <h1 className="mt-2 text-xl font-semibold">{guest.name}</h1>

      <div className="mt-4">
        <EditGuestForm guest={guest} />
      </div>

      <section className="mt-6">
        <h2 className="text-sm font-medium text-muted-foreground">Stay history</h2>
        {stays.length === 0 ? (
          <div className="mt-2 rounded-lg border p-4 text-sm text-muted-foreground">
            No stays yet.
          </div>
        ) : (
          <ul className="mt-2 divide-y rounded-lg border">
            {stays.map((s) => (
              <li key={s.id} className="p-3 text-sm">
                Room {s.rooms?.number} · {s.check_in_planned} → {s.check_out_planned} ·{" "}
                {STATUS_LABEL[s.status]}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
