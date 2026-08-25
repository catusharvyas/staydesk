"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  uploadPropertyLogo,
  removePropertyLogo,
  type LogoActionState,
} from "./actions";
import { LOGO_ACCEPT_ATTR, LOGO_MAX_BYTES, logoPublicUrl } from "@/lib/property-logo";

const INITIAL_STATE: LogoActionState = { error: null, saved: false };

export function LogoForm({ logoPath }: { logoPath: string | null }) {
  const [uploadState, uploadAction, uploading] = useActionState(
    uploadPropertyLogo,
    INITIAL_STATE
  );
  const [removeState, removeAction, removing] = useActionState(
    removePropertyLogo,
    INITIAL_STATE
  );
  // Local object-URL preview of the not-yet-uploaded file, so the user can
  // see what they picked before committing to it.
  const [preview, setPreview] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  // Drop the local preview once the server reports a different stored logo
  // (upload finished, or removal did). Without this the preview outlives the
  // action and wins over `storedUrl` — which showed up as a real bug: after
  // "Remove logo" the image stayed on screen even though it was gone from
  // both the DB and the bucket. Adjusting state during render is React's
  // documented fix for "reset state when a prop changes"; an effect here
  // trips react-hooks/set-state-in-effect (see room-board.tsx, same pattern).
  const [prevLogoPath, setPrevLogoPath] = useState(logoPath);
  if (logoPath !== prevLogoPath) {
    setPrevLogoPath(logoPath);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setClientError(null);
  }

  const storedUrl = logoPublicUrl(logoPath);
  const shown = preview ?? storedUrl;
  const error = clientError ?? uploadState.error ?? removeState.error;

  return (
    <div className="flex max-w-md flex-col gap-3">
      <Label htmlFor="logo">Brand logo</Label>

      {shown ? (
        // Deliberately a plain <img>, not next/image: this is a
        // user-uploaded Supabase Storage URL, which would otherwise need a
        // remotePatterns entry, and it buys nothing for a small logo.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={shown}
          alt="Property logo"
          className="h-16 w-auto max-w-[220px] rounded border bg-white object-contain p-2"
        />
      ) : (
        <p className="text-sm text-muted-foreground">No logo uploaded yet.</p>
      )}

      <form action={uploadAction} className="flex flex-col gap-2">
        <input
          id="logo"
          name="logo"
          type="file"
          accept={LOGO_ACCEPT_ATTR}
          className="text-sm file:mr-3 file:rounded-md file:border file:bg-transparent file:px-2 file:py-1 file:text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setClientError(null);
            if (preview) URL.revokeObjectURL(preview);
            if (!file) {
              setPreview(null);
              return;
            }
            // Instant feedback only — the server action and the bucket are
            // the real guards (same split as the guest form's validation).
            if (file.size > LOGO_MAX_BYTES) {
              setClientError("Logo must be 1 MB or smaller.");
              setPreview(null);
              return;
            }
            setPreview(URL.createObjectURL(file));
          }}
        />
        <p className="text-xs text-muted-foreground">
          PNG or JPEG, up to 1 MB. Prints on every tax invoice.
        </p>
        <div className="flex gap-2">
          <Button type="submit" disabled={uploading || !!clientError}>
            {uploading ? "Uploading…" : "Upload logo"}
          </Button>
        </div>
      </form>

      {logoPath && (
        <form action={removeAction}>
          <Button type="submit" variant="outline" disabled={removing}>
            {removing ? "Removing…" : "Remove logo"}
          </Button>
        </form>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      {!error && uploadState.saved && (
        <p className="text-sm text-muted-foreground">Logo updated.</p>
      )}
    </div>
  );
}
