"use server";

import { createClient } from "../utils/supabase/server";
import { actionClient } from "@/lib/safe-action";
import { Artist, ArtistPlatformId, ArtistUrl, ArtistMetric } from "../types/artists";
import { artistSchema } from "@/schemas/artists";
import { z } from "zod";
import { transformArtistResponse } from '@/utils/transforms/artist';

export const getArtists = actionClient
.action(async (): Promise<Artist[]> => {
  // Initialize the Supabase client using our server helper.
  const supabase = await createClient();

  // Query the "artists" table, selecting all columns.
  const { data, error } = await supabase.from("artists").select("*");
  
  // Throw an error if the query fails.
  if (error) {
    throw new Error(`Error fetching artists: ${error.message}`);
  }
  
  // Return the fetched artists.
  return data;
});


export const getArtistData = async(slug:string) => {
  const supabase = await createClient();
  const { data: artist, error } = await supabase
    .from("artists")
    .select(`
      *,
      artist_platform_ids (*),
      artist_urls (*),
      artist_metrics (*),
      artist_tracks (
        tracks!track_id(*)
      ),
      artist_videos (
        videos!video_id(*)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);
  
  return transformArtistResponse(artist);
}


export const updateArtist = actionClient
  .schema(artistSchema)
  .action(async ({ parsedInput }: { parsedInput: Artist }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artists")
      .update(parsedInput)
      .eq("id", parsedInput.id);
    if (error) {
      throw new Error(`Error updating artist: ${error.message}`);
    }
    return data;
  });

const deleteArtistSchema = z.object({
  id: z.string(),
});

export const deleteArtist = actionClient
  .schema(deleteArtistSchema)
  .action(async ({ parsedInput }: { parsedInput: { id: string } }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artists")
      .delete()
      .eq("id", parsedInput.id);
    if (error) {
      throw new Error(`Error deleting artist: ${error.message}`);
    }
    return data;
  });


