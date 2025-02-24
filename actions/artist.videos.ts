"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../lib/supabase/server";
import { ArtistVideo } from "../types/artists";
import { z } from "zod";

const artistVideosSchema = z.object({
  artist_id: z.string(),
});

export const getArtistVideos = actionClient
  .schema(artistVideosSchema)
  .action(async ({ parsedInput }: { parsedInput: { artist_id: string } }): Promise<ArtistVideo[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from<ArtistVideo>("videos")
      .select("*")
      .eq("artist_id", parsedInput.artist_id);
    if (error) throw new Error(`Error fetching videos for artist: ${error.message}`);
    return data;
}); 