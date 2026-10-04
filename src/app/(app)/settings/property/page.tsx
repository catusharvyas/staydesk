// Property identity/legal details — the write path for the `properties`
// row, which nothing had before this (bootstrap_property set it once at
// onboarding and no code touched it again). Notably this is where the
// invoice header's address comes from; it was never captured anywhere,
// so invoices printed a blank address line. Owner/admin only, enforced by
// properties_update RLS plus an app-level check for a friendlier error.
import { redirect } from "next/navigation";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { BackLink, PageHeader } from "@/components/page/page-header";
import { Surface } from "@/components/page/surface";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentProperty } from "@/lib/property";
import { PropertySettingsForm } from "./property-settings-form";
import { LogoForm } from "./logo-form";
import { ThemeForm } from "./theme-form";
import { resolveTheme } from "@/lib/theme-presets";

export default async function PropertySettingsPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  if (property.role !== "owner" && property.role !== "admin") {
    return (
      <div className="p-4 md:p-8">
        <BackLink href="/reports">Reports</BackLink>
        <PageHeader
          title="Property details"
          description="Only owners and admins can view property details."
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <BackLink href="/reports">Reports</BackLink>
      <PageHeader
        title="Property details"
        description="Identity and registration details for this property. These print on every tax invoice."
        action={
          <Link href="/settings/tax" className={buttonVariants({ variant: "outline" })}>
            <Receipt /> Tax settings
          </Link>
        }
      />
      <div className="mt-5 flex max-w-2xl flex-col gap-4">
        <Surface className="p-5">
          <LogoForm logoPath={property.logo_path} />
        </Surface>
        <Surface className="p-5">
          <ThemeForm theme={resolveTheme(property.theme)} />
        </Surface>
        <Surface className="p-5">
          <PropertySettingsForm property={property} />
        </Surface>
      </div>
    </div>
  );
}
