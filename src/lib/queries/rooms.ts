import { createClient } from "@/lib/supabase/server";

export async function listRoomTypes(propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("room_types")
    .select("*")
    .eq("property_id", propertyId)
    .order("name");

  if (error) throw error;
  return data;
}

export async function listRoomsWithType(propertyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_types(name)")
    .eq("property_id", propertyId)
    .order("number");

  if (error) throw error;
  return data;
}

export async function getRoomWithType(propertyId: string, roomId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rooms")
    .select("*, room_types(name, base_rate)")
    .eq("property_id", propertyId)
    .eq("id", roomId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
