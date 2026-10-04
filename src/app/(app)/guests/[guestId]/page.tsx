// Guest detail: editable contact info + full stay history at this property.
import { notFound, redirect } from "next/navigation";
import { ArrowRight, BedDouble } from "lucide-react";
import { BackLink, SectionTitle } from "@/components/page/page-header";
import { EmptyState, Surface, SurfaceList } from "@/components/page/surface";
import { getCurrentProperty } from "@/lib/property";
import { getGuest, getGuestStayHistory } from "@/lib/queries/guests";
import { EditGuestForm } from "../guest-forms";

const STATUS_CHIP: Record<string, string> = {
  reserved: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  checked_in: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
  checked_out: "bg-green-500/12 text-green-700 dark:text-green-400",
  cancelled: "bg-slate-500/12 text-slate-600 dark:text-slate-400",
};

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
    <div className="p-4 md:p-8">
      <BackLink href="/guests">Guests</BackLink>

      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold uppercase text-primary">
          {guest.name.trim().charAt(0)}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">{guest.name}</h1>
      </div>

      <Surface className="mt-5 max-w-xl p-5">
        <EditGuestForm guest={guest} />
      </Surface>

      <section className="mt-8">
        <SectionTitle>Stay history</SectionTitle>
        {stays.length === 0 ? (
          <EmptyState className="mt-3" icon={BedDouble} title="No stays yet" />
        ) : (
          <SurfaceList className="mt-3">
            {stays.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-3.5 text-sm">
                <span>
                  <span className="font-medium">Room {s.rooms?.number}</span>
                  <span className="ml-2 inline-flex items-center gap-1.5 text-muted-foreground">
                    {s.check_in_planned} <ArrowRight className="size-3" /> {s.check_out_planned}
                  </span>
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_CHIP[s.status] ?? ""}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </li>
            ))}
          </SurfaceList>
        )}
      </section>
    </div>
  );
}
