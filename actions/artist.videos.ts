"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../utils/supabase/server";
import { ArtistVideo, Video } from "../types/artists";
import { z } from "zod";

const artistVideosSchema = z.object({
  artist_id: z.string(),
});

const artistSlugSchema = z.object({
  slug: z.string(),
});

export const getArtistVideos = actionClient
  .schema(artistVideosSchema)
  .action(async ({ parsedInput }: { parsedInput: { artist_id: string } }): Promise<Video[]> => {
    const supabase = await createClient();
    
    // First get the artist_video connections
    const { data: artistVideos, error: connectionError } = await supabase
      .from("artist_videos")
      .select("video_id")
      .eq("artist_id", parsedInput.artist_id);
      
    if (connectionError) throw new Error(`Error fetching video connections: ${connectionError.message}`);
    if (!artistVideos || artistVideos.length === 0) return [];
    
    // Get the video IDs
    const videoIds = artistVideos.map(av => av.video_id);
    // Get the actual videos
    const { data: videos, error: videosError } = await supabase
      .from("videos")
      .select("*")
      .in("id", videoIds);
    if (videosError) throw new Error(`Error fetching videos: ${videosError.message}`);
    return videos || [];
});

export const getArtistVideosBySlug = actionClient
  .schema(artistSlugSchema)
  .action(async ({ parsedInput }: { parsedInput: { slug: string } }): Promise<Video[]> => {
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
      
      // Then get the videos using the existing function
      try {
        const artistVideos = await getArtistVideos({ artist_id: artist.id });
        return artistVideos.data;
      } catch (videoError) {
        console.error("Error fetching artist videos:", videoError);
        throw new Error(`Failed to fetch videos: ${(videoError as Error).message}`);
      }
    } catch (error) {
      console.error("Error in getArtistVideosBySlug:", error);
      throw error;
    }
  }); 