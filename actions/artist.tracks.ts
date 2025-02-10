"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../utils/supabase/server";
import { ArtistTrack } from "../types/artists";
import { z } from "zod";

const artistTracksSchema = z.object({
  artist_id: z.string(),
});

export const getArtistTracks = actionClient
  .schema(artistTracksSchema)
  .action(async ({ parsedInput }: { parsedInput: { artist_id: string } }): Promise<ArtistTrack[]> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from<ArtistTrack>("tracks")
      .select("*")
      .eq("artist_id", parsedInput.artist_id);
    if (error) throw new Error(`Error fetching tracks for artist: ${error.message}`);
    return data;
}); 