"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../lib/supabase/server";
import { z } from "zod";
import { ArtistVideo } from "../types/artists";

// Schema for videos (ArtistVideo)
export const videoSchema = z.object({
  id: z.string().optional(),
  artist_id: z.string(),
  title: z.string(),
  video_id: z.string(),
  platform: z.literal("youtube"),
  view_count: z.number().nullable(),
  monthly_view_count: z.number().nullable(),
  thumbnail_url: z.string().nullable(),
  published_at: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Fetch all videos
export const getVideos = actionClient.action(async (): Promise<ArtistVideo[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from<ArtistVideo>("videos").select("*");
  if (error) throw new Error(`Error fetching videos: ${error.message}`);
  return data;
});

// Add a video
export const addVideo = actionClient
  .schema(videoSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistVideo }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("videos").insert(parsedInput);
    if (error) throw new Error(`Error adding video: ${error.message}`);
    return data;
});

// Update a video
export const updateVideo = actionClient
  .schema(videoSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistVideo }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("videos")
      .update(parsedInput)
      .eq("id", parsedInput.id);
    if (error) throw new Error(`Error updating video: ${error.message}`);
    return data;
});

// Delete a video
export const deleteVideo = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }: { parsedInput: { id: string } }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("videos").delete().eq("id", parsedInput.id);
    if (error) throw new Error(`Error deleting video: ${error.message}`);
    return data;
}); 