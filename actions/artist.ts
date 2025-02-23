"use server";

import { createClient } from "../utils/supabase/server";
import { actionClient } from "@/lib/safe-action";
import { Artist, ArtistPlatformId, ArtistUrl, ArtistMetric } from "../types/artists";
import { artistSchema } from "@/schemas/artists";
import { z } from "zod";
import { transformArtistResponse } from '@/utils/transforms/artist';
import { createSpotifyService } from "@/services/spotify-service";

export const getArtists = actionClient
  .action(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("artists")
      .select(`
        *,
        artist_platform_ids (
          platform,
          platform_id
        )
      `);
    
    console.log('getArtists response:', { data, error }); // Debug log
    
    if (error) {
      console.error("Error fetching artists:", error);
      throw error;
    }

    // Ensure we return an array
    return { 
      data: Array.isArray(data) ? data : [] 
    };
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

export const getArtistMetrics = actionClient
  .action(async () => {
    const supabase = await createClient();
    
    // Add debug log
    console.log('Fetching metrics from database...');
    
    const { data: metrics, error } = await supabase
      .from("artist_metrics")
      .select("*")
      .in('metric_type', ['subscribers', 'popularity'])
      .in('platform', ['youtube', 'spotify'])
      .order('created_at', { ascending: false });
    
    // Add debug log
    console.log('Metrics response:', { metrics, error });
    
    if (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }

    // Ensure we return the expected structure
    return { 
      data: metrics ?? [] 
    };
  });

// Update schema to use only artist name
const updateSpotifyPopularitySchema = z.object({
  artistName: z.string()
});

export const updateSpotifyPopularity = actionClient
  .schema(updateSpotifyPopularitySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const spotifyService = createSpotifyService();
    const { artistName } = parsedInput;
    
    // First get the artist from name
    const { data: artist, error: artistError } = await supabase
      .from("artists")
      .select("id")
      .eq("name", artistName)
      .single();

    if (artistError || !artist) {
      throw new Error(`Artist not found: ${artistError?.message || 'No artist with this name'}`);
    }

    // Get current popularity from Spotify
    const spotifyData = await spotifyService.getArtist(artistName);
    if (!spotifyData?.popularity || !spotifyData?.id) {
      throw new Error('Could not fetch Spotify popularity');
    }

    const platformData = {
      artist_id: artist.id,
      platform: 'spotify' as const,
      platform_id: spotifyData.id
    };

    const timestamp = new Date().toISOString();
    const metricData = {
      artist_id: artist.id,
      platform: 'spotify' as const,
      metric_type: 'popularity' as const,
      value: spotifyData.popularity,
      date: timestamp
    };

    // Update platform ID
    const { error: platformError } = await supabase
      .from("artist_platform_ids")
      .upsert(platformData, {
        onConflict: 'artist_id,platform'
      });

    if (platformError) {
      throw new Error(`Error updating spotify platform: ${platformError.message}`);
    }

    // Update metrics
    const { data, error } = await supabase
      .from("artist_metrics")
      .upsert(metricData, {
        onConflict: 'artist_id,platform,metric_type,date'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating spotify popularity: ${error.message}`);
    }

    return { 
      success: true, 
      data, 
      platform: platformData,
      message: `Updated Spotify popularity to ${spotifyData.popularity}`
    };
  });

const bulkUpdateSpotifyPopularitySchema = z.object({
  artists: z.array(z.object({
    artistName: z.string()
  }))
});

export const bulkUpdateSpotifyPopularity = actionClient
  .schema(bulkUpdateSpotifyPopularitySchema)
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();
    const spotifyService = createSpotifyService();
    const timestamp = new Date().toISOString();
    
    const results = await Promise.all(
      parsedInput.artists.map(async ({ artistName }) => {
        try {
          // Get artist ID from name
          const { data: artist, error: artistError } = await supabase
            .from("artists")
            .select("id")
            .eq("name", artistName)
            .single();

          if (artistError || !artist) {
            return { artistName, error: 'Artist not found in database' };
          }

          // Get Spotify data
          const spotifyData = await spotifyService.getArtist(artistName);
          if (!spotifyData?.popularity || !spotifyData?.id) {
            return { artistName, error: 'Could not fetch Spotify popularity' };
          }

          // Update platform ID
          const { error: platformError } = await supabase
            .from("artist_platform_ids")
            .upsert({
              artist_id: artist.id,
              platform: 'spotify',
              platform_id: spotifyData.id
            }, {
              onConflict: 'artist_id,platform'
            });

          if (platformError) throw platformError;

          // Update metrics
          const { error: metricsError } = await supabase
            .from("artist_metrics")
            .upsert({
              artist_id: artist.id,
              platform: 'spotify',
              metric_type: 'popularity',
              value: spotifyData.popularity,
              date: timestamp
            }, {
              onConflict: 'artist_id,platform,metric_type,date'
            });

          if (metricsError) throw metricsError;

          return { 
            artistName, 
            success: true, 
            popularity: spotifyData.popularity 
          };
        } catch (error) {
          return { 
            artistName, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          };
        }
      })
    );

    const successful = results.filter(r => 'success' in r);
    const failed = results.filter(r => 'error' in r);

    return {
      success: failed.length === 0,
      message: `Updated ${successful.length} artists${failed.length > 0 ? `, ${failed.length} failed` : ''}`,
      results
    };
  });


