// Visual room board: Available, Occupied, Reserved, Cleaning, Maintenance.
// See PROJECT.md §2 for the room-card layout and workflow rule
// (Occupied -> Checkout -> Cleaning -> Available). Live-updates via
// Supabase Realtime — see room-board.tsx.
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { listRoomsWithType, listRoomTypes } from "@/lib/queries/rooms";
import { AddRoomForm, AddRoomTypeForm } from "./room-forms";
import { RoomBoard } from "./room-board";

export default async function RoomsPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const [rooms, roomTypes] = await Promise.all([
    listRoomsWithType(property.id),
    listRoomTypes(property.id),
  ]);

  const canManage = property.role === "owner" || property.role === "admin";
  const roomTypeNames = Object.fromEntries(roomTypes.map((rt) => [rt.id, rt.name]));

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-semibold">Rooms</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tap a room to view guest, stay, charges and payments.
      </p>

      {canManage && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg border p-3">
          <AddRoomTypeForm />
          {roomTypes.length > 0 && (
            <AddRoomForm roomTypes={roomTypes.map((rt) => ({ id: rt.id, name: rt.name }))} />
          )}
        </div>
      )}

      <RoomBoard
        propertyId={property.id}
        initialRooms={rooms}
        roomTypeNames={roomTypeNames}
        hasRoomTypes={roomTypes.length > 0}
      />
    </div>
  );
}
