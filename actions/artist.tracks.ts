"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../lib/supabase/server";
import { ArtistTrack, Track } from "../types/artists";
import { z } from "zod";

const artistTracksSchema = z.object({
  artist_id: z.string(),
});

const artistSlugSchema = z.object({
  slug: z.string(),
});

export const getArtistTracks = actionClient
  .schema(artistTracksSchema)
  .action(async ({ parsedInput }: { parsedInput: { artist_id: string } }): Promise<Track[]> => {
    const supabase = await createClient();
    
    // First get the artist_track connections
    const { data: artistTracks, error: connectionError } = await supabase
      .from("artist_tracks")
      .select("track_id")
      .eq("artist_id", parsedInput.artist_id);
      
    if (connectionError) throw new Error(`Error fetching track connections: ${connectionError.message}`);
    if (!artistTracks || artistTracks.length === 0) return [];
    
    // Get the track IDs
    const trackIds = artistTracks.map(at => at.track_id);
    
    // Get the actual tracks
    const { data: tracks, error: tracksError } = await supabase
      .from("tracks")
      .select("*")
      .in("id", trackIds);
      
    if (tracksError) throw new Error(`Error fetching tracks: ${tracksError.message}`);
    return tracks || [];
});

export const getArtistTracksBySlug = actionClient
  .schema(artistSlugSchema)
  .action(async ({ parsedInput }: { parsedInput: { slug: string } }): Promise<Track[]> => {
    try {
      const supabase = await createClient();
      
      // First get the artist by slug
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("id")
        .eq("slug", parsedInput.slug)
        .single();
        
      if (artistError) throw new Error(`Error fetching artist: ${artistError.message}`);
      if (!artist) throw new Error(`Artist not found with slug: ${parsedInput.slug}`);
      
      // Then get the tracks using the existing function
      try {
        const artistTracks = await getArtistTracks({ artist_id: artist.id });
        return artistTracks.data;
      } catch (trackError) {
        console.error("Error fetching artist tracks:", trackError);
        throw new Error(`Failed to fetch tracks: ${(trackError as Error).message}`);
      }
    } catch (error) {
      console.error("Error in getArtistTracksBySlug:", error);
      throw error;
    }
  }); 