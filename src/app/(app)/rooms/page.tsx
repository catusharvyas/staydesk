// Visual room board: Available, Occupied, Reserved, Cleaning, Maintenance.
// See PROJECT.md §2 for the room-card layout and workflow rule
// (Occupied -> Checkout -> Cleaning -> Available).
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProperty } from "@/lib/property";
import { listRoomsWithType, listRoomTypes } from "@/lib/queries/rooms";
import { AddRoomForm, AddRoomTypeForm } from "./room-forms";
import { ReleaseRoomButton } from "./release-button";

const STATUS_STYLES: Record<string, string> = {
  available: "text-green-600 dark:text-green-400",
  occupied: "text-blue-600 dark:text-blue-400",
  reserved: "text-amber-600 dark:text-amber-400",
  cleaning: "text-muted-foreground",
  maintenance: "text-red-600 dark:text-red-400",
};

export default async function RoomsPage() {
  const property = await getCurrentProperty();
  if (!property) redirect("/onboarding");

  const [rooms, roomTypes] = await Promise.all([
    listRoomsWithType(property.id),
    listRoomTypes(property.id),
  ]);

  const canManage = property.role === "owner" || property.role === "admin";

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

      {rooms.length === 0 ? (
        <div className="mt-4 rounded-lg border p-4 text-sm text-muted-foreground">
          {roomTypes.length === 0
            ? "Add a room type above to get started."
            : "No rooms yet — add one above."}
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {rooms.map((room) => (
            <div key={room.id} className="rounded-lg border p-3">
              <Link href={`/rooms/${room.id}`} className="block hover:opacity-80">
                <div className="text-sm font-semibold">{room.number}</div>
                <div className={`text-xs font-medium uppercase ${STATUS_STYLES[room.status]}`}>
                  {room.status}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {room.room_types?.name}
                </div>
              </Link>
              {room.status === "cleaning" && <ReleaseRoomButton roomId={room.id} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
