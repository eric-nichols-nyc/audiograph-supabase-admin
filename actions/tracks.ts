"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../utils/supabase/server";
import { z } from "zod";
import { ArtistTrack } from "../types/artists";

// Schema for tracks (ArtistTrack)
export const trackSchema = z.object({
  id: z.string().optional(),
  artist_id: z.string(),
  title: z.string(),
  track_id: z.string(),
  platform: z.literal('spotify'),
  popularity: z.number().nullable(),
  stream_count_total: z.number().nullable(),
  stream_count_monthly: z.number().nullable(),
  preview_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  external_url: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Fetch all tracks
export const getTracks = actionClient.action(async (): Promise<ArtistTrack[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from<ArtistTrack>("tracks").select("*");
  if (error) throw new Error(`Error fetching tracks: ${error.message}`);
  return data;
});

// Add a track
export const addTrack = actionClient
  .schema(trackSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistTrack }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("tracks").insert(parsedInput);
    if (error) throw new Error(`Error adding track: ${error.message}`);
    return data;
});

// Update a track
export const updateTrack = actionClient
  .schema(trackSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistTrack }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tracks")
      .update(parsedInput)
      .eq("id", parsedInput.id);
    if (error) throw new Error(`Error updating track: ${error.message}`);
    return data;
});

// Delete a track
export const deleteTrack = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }: { parsedInput: { id: string } }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("tracks").delete().eq("id", parsedInput.id);
    if (error) throw new Error(`Error deleting track: ${error.message}`);
    return data;
}); 