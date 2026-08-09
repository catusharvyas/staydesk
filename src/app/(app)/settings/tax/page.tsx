// GST configuration — kept in Settings, not hardcoded, so rates/thresholds
// can be updated when tax rules change (PROJECT.md §5). Owner/admin only,
// enforced by tax_settings_write RLS.
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { getTaxSettings } from "@/lib/queries/pricing";
import { TaxSettingsForm } from "./tax-settings-form";

export default async function TaxSettingsPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  if (property.role !== "owner" && property.role !== "admin") {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold">Tax settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Only owners and admins can view tax settings.
        </p>
      </div>
    );
  }

  const settings = await getTaxSettings(property.id);
  if (!settings) {
    return (
      <div className="p-4 md:p-6">
        <h1 className="text-xl font-semibold">Tax settings</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No tax settings found for this property.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold">Tax settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This is an application-design illustration — validate against the
        GST rules applicable to your property and transaction date before
        relying on it in production.
      </p>
      <div className="mt-4">
        <TaxSettingsForm settings={settings} />
      </div>
    </div>
  );
}
