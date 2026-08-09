"use client";

import { useActionState } from "react";
import { releaseRoom, type RoomActionState } from "./actions";

const INITIAL_STATE: RoomActionState = { error: null };

/** Housekeeping's explicit Cleaning -> Available release (PROJECT.md §1). */
export function ReleaseRoomButton({ roomId }: { roomId: string }) {
  const [state, formAction, pending] = useActionState(releaseRoom, INITIAL_STATE);

  return (
    <form action={formAction} className="mt-1">
      <input type="hidden" name="roomId" value={roomId} />
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded border px-2 py-1 text-xs hover:bg-muted"
      >
        {pending ? "…" : "Release"}
      </button>
      {state.error && <p className="mt-1 text-[10px] text-destructive">{state.error}</p>}
    </form>
  );
}
