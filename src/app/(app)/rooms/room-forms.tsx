"use client";

import { useActionState } from "react";
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
import { createRoom, createRoomType, type RoomActionState } from "./actions";

const INITIAL_STATE: RoomActionState = { error: null };

export function AddRoomTypeForm() {
  const [state, formAction, pending] = useActionState(createRoomType, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="rt-name" className="text-xs">Room type</Label>
        <Input id="rt-name" name="name" placeholder="e.g. Deluxe" required className="h-9 w-40" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="rt-rate" className="text-xs">Base rate (₹/night)</Label>
        <Input
          id="rt-rate"
          name="baseRate"
          type="number"
          min="0"
          step="1"
          placeholder="3000"
          required
          className="h-9 w-32"
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Adding…" : "Add room type"}
      </Button>
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}

export function AddRoomForm({
  roomTypes,
}: {
  roomTypes: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(createRoom, INITIAL_STATE);
  // Base UI's Select.Value resolves the displayed label from this `items`
  // map — it does NOT infer labels from declaratively-rendered <SelectItem>
  // children, so without it the trigger shows the raw value (a uuid here).
  const roomTypeItems = Object.fromEntries(roomTypes.map((rt) => [rt.id, rt.name]));

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div className="flex flex-col gap-1">
        <Label htmlFor="r-number" className="text-xs">Room number</Label>
        <Input id="r-number" name="number" placeholder="101" required className="h-9 w-24" />
      </div>
      <div className="flex flex-col gap-1">
        <Label htmlFor="r-floor" className="text-xs">Floor</Label>
        <Input id="r-floor" name="floor" placeholder="1" className="h-9 w-20" />
      </div>
      <div className="flex flex-col gap-1">
        <Label className="text-xs">Room type</Label>
        <Select name="roomTypeId" items={roomTypeItems} required>
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
        {pending ? "Adding…" : "Add room"}
      </Button>
      {state.error && <p className="w-full text-xs text-destructive">{state.error}</p>}
    </form>
  );
}
