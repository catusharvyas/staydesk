"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updatePropertyTheme, type ThemeActionState } from "./actions";
import { THEME_PRESETS, type ThemeKey } from "@/lib/theme-presets";

const INITIAL_STATE: ThemeActionState = { error: null, saved: false };

export function ThemeForm({ theme }: { theme: ThemeKey }) {
  const [state, formAction, pending] = useActionState(updatePropertyTheme, INITIAL_STATE);
  const [selected, setSelected] = useState<ThemeKey>(theme);

  // Re-sync the selection when the server reports a different saved theme,
  // during render rather than in an effect (React's documented pattern for
  // "reset state when a prop changes" — same as room-board.tsx and the logo
  // form). Without it, a save elsewhere would leave this picker stale.
  const [prevTheme, setPrevTheme] = useState(theme);
  if (theme !== prevTheme) {
    setPrevTheme(theme);
    setSelected(theme);
  }

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-3">
      <Label>Accent colour</Label>
      {/* Swatches use their own literal hex, not var(--primary): the picker
          shows every option at once, but only one is the active token. */}
      <div className="flex flex-wrap gap-2">
        {THEME_PRESETS.map((preset) => {
          const active = selected === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setSelected(preset.key)}
              aria-pressed={active}
              title={`${preset.label} — ${preset.note}`}
              className={`flex size-10 items-center justify-center rounded-lg border-2 transition-colors ${
                active ? "border-foreground" : "border-transparent hover:border-border"
              }`}
              style={{ backgroundColor: preset.swatch }}
            >
              <span className="sr-only">{preset.label}</span>
              {active && <Check className="size-4 text-white" aria-hidden />}
            </button>
          );
        })}
      </div>
      <input type="hidden" name="theme" value={selected} />

      <p className="text-xs text-muted-foreground">
        {THEME_PRESETS.find((p) => p.key === selected)?.label} — applies to
        buttons, active navigation and focus rings, for everyone using this
        property. Light/dark mode stays a personal per-device setting.
      </p>

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}
      {!state.error && state.saved && (
        <p className="text-sm text-muted-foreground">Accent colour saved.</p>
      )}

      <Button type="submit" disabled={pending || selected === theme} className="w-fit">
        {pending ? "Saving…" : "Save accent colour"}
      </Button>
    </form>
  );
}
