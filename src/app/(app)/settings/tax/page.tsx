// GST configuration — kept in Settings, not hardcoded, so rates/thresholds
// can be updated when tax rules change (PROJECT.md §5). Owner/admin only,
// enforced by tax_settings_write RLS.
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { BackLink, PageHeader } from "@/components/page/page-header";
import { Surface } from "@/components/page/surface";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentProperty } from "@/lib/property";
import { getTaxSettings } from "@/lib/queries/pricing";
import { TaxSettingsForm } from "./tax-settings-form";

export default async function TaxSettingsPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  if (property.role !== "owner" && property.role !== "admin") {
    return (
      <div className="p-4 md:p-8">
        <BackLink href="/reports">Reports</BackLink>
        <PageHeader
          title="Tax settings"
          description="Only owners and admins can view tax settings."
        />
      </div>
    );
  }

  const settings = await getTaxSettings(property.id);
  if (!settings) {
    return (
      <div className="p-4 md:p-8">
        <BackLink href="/reports">Reports</BackLink>
        <PageHeader
          title="Tax settings"
          description="No tax settings found for this property."
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <BackLink href="/reports">Reports</BackLink>
      <PageHeader
        title="Tax settings"
        description="This is an application-design illustration — validate against the GST rules applicable to your property and transaction date before relying on it in production."
        action={
          <Link href="/settings/property" className={buttonVariants({ variant: "outline" })}>
            <Building2 /> Property details
          </Link>
        }
      />
      <Surface className="mt-5 max-w-2xl p-5">
        <TaxSettingsForm settings={settings} />
      </Surface>
    </div>
  );
}
