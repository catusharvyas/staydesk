"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ReleaseRoomButton } from "./release-button";
import type { listRoomsWithType } from "@/lib/queries/rooms";
import type { Tables } from "@/lib/supabase/database.types";

type Room = Awaited<ReturnType<typeof listRoomsWithType>>[number];

const STATUS_STYLES: Record<string, string> = {
  available: "text-green-600 dark:text-green-400",
  occupied: "text-blue-600 dark:text-blue-400",
  reserved: "text-amber-600 dark:text-amber-400",
  cleaning: "text-muted-foreground",
  maintenance: "text-red-600 dark:text-red-400",
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
      <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
        {hasRoomTypes ? "No rooms yet — add one above." : "Add a room type above to get started."}
      </div>
    );
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {rooms.map((room) => (
        <div key={room.id} className="rounded-lg border p-3">
          <Link href={`/rooms/${room.id}`} className="block hover:opacity-80">
            <div className="text-sm font-semibold">{room.number}</div>
            <div className={`text-xs font-medium uppercase ${STATUS_STYLES[room.status]}`}>
              {room.status}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{room.room_types?.name}</div>
          </Link>
          {room.status === "cleaning" && <ReleaseRoomButton roomId={room.id} />}
        </div>
      ))}
    </div>
  );
}
