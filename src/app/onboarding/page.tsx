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
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
            S
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">Set up your property</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            One-time setup — you can add more properties later.
          </p>
        </div>
        <div className="mt-6 rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/8">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
