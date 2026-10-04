"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BedDouble } from "lucide-react";
import { EmptyState } from "@/components/page/surface";
import { ReleaseRoomButton } from "./release-button";
import type { listRoomsWithType } from "@/lib/queries/rooms";
import type { Tables } from "@/lib/supabase/database.types";

type Room = Awaited<ReturnType<typeof listRoomsWithType>>[number];

// Semantic status colours — deliberately separate from the brand accent.
const STATUS_STYLES: Record<string, { dot: string; chip: string; edge: string }> = {
  available: {
    dot: "bg-green-500",
    chip: "bg-green-500/12 text-green-700 dark:text-green-400",
    edge: "border-l-green-500",
  },
  occupied: {
    dot: "bg-blue-500",
    chip: "bg-blue-500/12 text-blue-700 dark:text-blue-400",
    edge: "border-l-blue-500",
  },
  reserved: {
    dot: "bg-amber-500",
    chip: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    edge: "border-l-amber-500",
  },
  cleaning: {
    dot: "bg-slate-400",
    chip: "bg-slate-500/12 text-slate-600 dark:text-slate-400",
    edge: "border-l-slate-400",
  },
  maintenance: {
    dot: "bg-red-500",
    chip: "bg-red-500/12 text-red-700 dark:text-red-400",
    edge: "border-l-red-500",
  },
};

/**
 * Live-updating room board — closes the "room board doesn't live-update if
 * another device changes a room's status" gap noted since Phase 2.
 * Supabase Realtime's postgres_changes already respects RLS per-connection
 * (see migration 0008), so this only ever receives rows for properties the
 * signed-in user is actually a member of.
 *
 * `roomTypeNames` resolves the incoming raw row's room_type_id to a display
 * name — postgres_changes payloads are the bare table row, no join, so a
 * status/floor/number/type change can't reuse whatever `room_types` object
 * the server originally sent down.
 */
export function RoomBoard({
  propertyId,
  initialRooms,
  roomTypeNames,
  hasRoomTypes,
}: {
  propertyId: string;
  initialRooms: Room[];
  roomTypeNames: Record<string, string>;
  hasRoomTypes: boolean;
}) {
  const [rooms, setRooms] = useState(initialRooms);
  // Re-seed whenever the server sends fresh data (e.g. after this same
  // client adds/edits a room and revalidatePath re-renders the page) —
  // keeps local state from silently drifting from what the server has.
  // Adjusted during render (React's documented pattern for "reset state
  // when a prop changes"), not in an effect — an effect here would fire
  // an extra commit/paint for something render can just resolve directly.
  const [prevInitialRooms, setPrevInitialRooms] = useState(initialRooms);
  if (initialRooms !== prevInitialRooms) {
    setPrevInitialRooms(initialRooms);
    setRooms(initialRooms);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`rooms:${propertyId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms", filter: `property_id=eq.${propertyId}` },
        (payload) => {
          setRooms((prev) => {
            if (payload.eventType === "DELETE") {
              const oldRow = payload.old as Partial<Tables<"rooms">>;
              return prev.filter((r) => r.id !== oldRow.id);
            }
            const incoming = payload.new as Tables<"rooms">;
            const withType: Room = {
              ...incoming,
              room_types: { name: roomTypeNames[incoming.room_type_id] ?? "" },
            };
            const exists = prev.some((r) => r.id === incoming.id);
            const next = exists
              ? prev.map((r) => (r.id === incoming.id ? withType : r))
              : [...prev, withType];
            return next.sort((a, b) =>
              a.number.localeCompare(b.number, undefined, { numeric: true })
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [propertyId, roomTypeNames]);

  if (rooms.length === 0) {
    return (
      <EmptyState
        className="mt-5"
        icon={BedDouble}
        title={hasRoomTypes ? "No rooms yet" : "Start with a room type"}
        hint={hasRoomTypes ? "Add your first room above." : "Add a room type above, then add rooms to it."}
      />
    );
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {rooms.map((room) => {
        const st = STATUS_STYLES[room.status] ?? STATUS_STYLES.cleaning;
        return (
          <div
            key={room.id}
            className={`rounded-xl border-l-4 bg-card p-3.5 shadow-sm ring-1 ring-foreground/8 transition-shadow hover:shadow-md ${st.edge}`}
          >
            <Link href={`/rooms/${room.id}`} className="block">
              <div className="flex items-start justify-between gap-2">
                <div className="text-xl font-semibold leading-none tracking-tight">{room.number}</div>
                <span className={`size-2.5 rounded-full ${st.dot}`} aria-hidden />
              </div>
              <div className="mt-2 truncate text-xs text-muted-foreground">{room.room_types?.name}</div>
              <span
                className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${st.chip}`}
              >
                {room.status}
              </span>
            </Link>
            {room.status === "cleaning" && <ReleaseRoomButton roomId={room.id} />}
          </div>
        );
      })}
    </div>
  );
}
