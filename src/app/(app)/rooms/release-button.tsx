"use client";

import { useActionState } from "react";
import { releaseRoom, type RoomActionState } from "./actions";

const INITIAL_STATE: RoomActionState = { error: null };

/** Housekeeping's explicit Cleaning -> Available release (PROJECT.md §1). */
export function ReleaseRoomButton({ roomId }: { roomId: string }) {
  const [state, formAction, pending] = useActionState(releaseRoom, INITIAL_STATE);

  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="roomId" value={roomId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-lg bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "…" : "Mark clean"}
      </button>
      {state.error && <p className="mt-1 text-[10px] text-destructive">{state.error}</p>}
    </form>
  );
}
