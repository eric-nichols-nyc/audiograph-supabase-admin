"use server";

import { createClient } from "../utils/supabase/server";
import { actionClient } from "@/lib/safe-action";
import { Artist, ArtistPlatformId, ArtistUrl, ArtistMetric } from "../types/artists";
import { artistSchema } from "@/schemas/artists";
import { z } from "zod";
import { aggregateArtistData } from '@/services/artistAggregator';

// Define a schema for the full input
const addArtistFullSchema = z.object({
    artist: artistSchema,
    platformData: z.array(z.object({
      platform: z.enum(["spotify", "youtube", "lastfm", "musicbrainz"]),
      platform_id: z.string()
    })),
    urlData: z.array(z.object({
      platform: z.enum(["spotify", "youtube", "instagram", "tiktok", "facebook", "viberate", "lastfm"]),
      url: z.string(),
    })),
    metricData: z.array(z.object({
      id: z.string().optional(),
      date: z.string(),
      platform: z.string(),
      metric_type: z.enum(["followers", "views", "likes", "subscribers", "monthly_listeners", "play_count"]),
      value: z.number(),
    }))
  });

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


export const addArtist = actionClient
.schema(artistSchema)
.action(async ({ parsedInput }: { parsedInput: Artist }) => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("artists").insert(parsedInput);
  if (error) {
    throw new Error(`Error adding artist: ${error.message}`);
  }
  return data;
});

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



// New Action: Add an artist along with platform, URL, and metric data in a single transaction.
export const addArtistFull = actionClient
  .schema(addArtistFullSchema)
  .action(
    async ({ parsedInput }) => {
      const { artist, platformData, urlData, metricData } = parsedInput;
      // Get aggregated data from multiple sources
      const { artistInfo, viberateData, kworbData } = await aggregateArtistData(artist.id, artist.name);
      
      // Merge or transform the aggregated data as needed into your full artist record
      const fullArtistData = {
        ...artistInfo,
        viberate: viberateData,
        kworb: kworbData,
      };

      const supabase = await createClient();

      // Begin transaction (requires corresponding RPC functions in your database)
      const { error: txBeginError } = await supabase.rpc('begin_transaction');
      if (txBeginError) {
        throw new Error(`Failed to begin transaction: ${txBeginError.message}`);
      }

      try {
        // Insert artist record and retrieve the inserted record (assuming it returns an id)
        const { data: artistData, error: artistError } = await supabase
          .from("artists")
          .insert(artist)
          .select()
          .single();

        if (artistError) {
          throw new Error(`Error inserting artist: ${artistError.message}`);
        }
        
        // Insert platform data using artistData.id
        for (const platform of platformData) {
            const platformInsert = { ...platform, artist_id: artistData.id };
            const { error: platformError } = await supabase
                .from("artist_platform_ids")
                .insert(platformInsert);
            if (platformError) {
                throw new Error(`Error inserting artist platform: ${platformError.message}`);
            }
        }

        // Insert URL data
        for (const url of urlData) {
            const urlInsert = { ...url, artist_id: artistData.id };
            const { error: urlError } = await supabase
                .from("artist_urls")
                .insert(urlInsert);
            if (urlError) {
                throw new Error(`Error inserting artist URL: ${urlError.message}`);
            }
        }

        // Insert metric data
        for (const metric of metricData) {
            const metricInsert = { ...metric, artist_id: artistData.id };
            const { error: metricError } = await supabase
                .from("artist_metrics")
                .insert(metricInsert);
            if (metricError) {
                throw new Error(`Error inserting artist metric: ${metricError.message}`);
            }
        }

        // Commit transaction if all operations succeed
        const { error: txCommitError } = await supabase.rpc('commit_transaction');
        if (txCommitError) {
          throw new Error(`Failed to commit transaction: ${txCommitError.message}`);
        }

        return fullArtistData;
      } catch (error) {
        // Rollback the transaction in case of any error
        await supabase.rpc('rollback_transaction');
        throw error;
      }
    }
  );