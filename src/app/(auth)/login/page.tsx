"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp, type AuthActionState } from "./actions";

const INITIAL_STATE: AuthActionState = { error: null };

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, INITIAL_STATE);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-gradient-to-b from-primary/10 via-background to-background p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground shadow-lg shadow-primary/25">
            S
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Sign in to manage your property." : "Set up Stay in a minute."}
          </p>
        </div>

        <div className="rounded-2xl bg-card p-6 shadow-sm ring-1 ring-foreground/8">
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" className="h-10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                className="h-10"
              />
            </div>

            {state.error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
          </form>
        </div>

        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 block w-full cursor-pointer text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "No account? " : "Already have an account? "}
          <span className="font-medium text-primary">
            {mode === "signin" ? "Sign up" : "Sign in"}
          </span>
        </button>
      </div>
    </div>
  );
}
