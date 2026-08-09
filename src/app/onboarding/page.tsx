import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentProperty } from "@/lib/property";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const property = await getCurrentProperty();
  if (property) redirect("/dashboard");

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold">Set up your property</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One-time setup — you can add more properties later.
        </p>
        <OnboardingForm />
      </div>
    </div>
  );
}
