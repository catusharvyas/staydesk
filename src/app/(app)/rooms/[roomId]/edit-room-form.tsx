"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateRoom, type RoomActionState } from "../actions";

const INITIAL_STATE: RoomActionState = { error: null };

export function EditRoomForm({
  room,
  roomTypes,
}: {
  room: { id: string; number: string; floor: string | null; room_type_id: string };
  roomTypes: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateRoom, INITIAL_STATE);
  // Base UI's Select.Value needs an explicit items map to resolve the label
  // — see the room-forms.tsx comment for the same bug/pattern.
  const roomTypeItems = Object.fromEntries(roomTypes.map((rt) => [rt.id, rt.name]));

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Edit room
      </Button>
    );
  }

  return (
    // Keyed on the room's current field values so a successful save (which
    // brings new defaultValue props via revalidatePath) remounts these
    // Base-UI-backed uncontrolled fields fresh instead of mutating an
    // already-initialized instance's defaultValue — the latter trips a
    // real Base UI warning ("changing the default value ... after being
    // initialized"), same class of issue the Select-items-map bug already
    // documented elsewhere in this file's sibling forms.
    <form
      key={`${room.number}-${room.floor}-${room.room_type_id}`}
      action={formAction}
      className="flex flex-wrap items-end gap-2 rounded-lg border p-3"
    >
      <input type="hidden" name="roomId" value={room.id} />
      <div className="flex flex-col gap-1">
        <Label htmlFor="e-number" className="text-xs">Room number</Label>
        <Input id="e-number" name="number" defaultValue={room.number} required className="h-9 w-24" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="e-floor" className="text-xs">Floor</Label>
        <Input id="e-floor" name="floor" defaultValue={room.floor ?? ""} className="h-9 w-20" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Room type</Label>
        <Select name="roomTypeId" items={roomTypeItems} defaultValue={room.room_type_id} required>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            {roomTypes.map((rt) => (
              <SelectItem key={rt.id} value={rt.id}>
                {rt.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
