// Property identity/legal details — the write path for the `properties`
// row, which nothing had before this (bootstrap_property set it once at
// onboarding and no code touched it again). Notably this is where the
// invoice header's address comes from; it was never captured anywhere,
// so invoices printed a blank address line. Owner/admin only, enforced by
// properties_update RLS plus an app-level check for a friendlier error.
import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProperty } from "@/lib/property";
import { PropertySettingsForm } from "./property-settings-form";

export default async function PropertySettingsPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  if (property.role !== "owner" && property.role !== "admin") {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold">Property details</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only owners and admins can view property details.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Property details</h1>
        <Link href="/settings/tax" className="text-sm underline">
          Tax settings →
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Identity and registration details for this property. These print on
        every tax invoice.
      </p>
      <div className="mt-4">
        <PropertySettingsForm property={property} />
      </div>
    </div>
  );
}
