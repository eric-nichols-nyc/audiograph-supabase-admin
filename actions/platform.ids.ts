'use server';

import { actionClient } from '@/lib/safe-action';
import { createClient } from '../lib/supabase//server';
import { z } from 'zod';
import { ArtistPlatformId } from '../types/artists';

// Schema for ArtistPlatformId
export const platformSchema = z.object({
  artist_id: z.string(),
  platform: z.enum(['spotify', 'youtube', 'lastfm', 'musicbrainz']),
  platform_id: z.string(),
  created_at: z.string().optional(),
});

// Fetch platform IDs
export const getPlatformis = actionClient.action(async (): Promise<ArtistPlatformId[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from('platformis').select('*');
  if (error) throw new Error(`Error fetching platform IDs: ${error.message}`);
  return data;
});

// Add a platform ID
export const addPlatform = actionClient
  .schema(platformSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistPlatformId }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from('platformis').insert(parsedInput);
    if (error) throw new Error(`Error adding platform ID: ${error.message}`);
    return data;
  });

// Update a platform ID
export const updatePlatform = actionClient
  .schema(platformSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistPlatformId }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('artist_platform_ids')
      .upsert(
        {
          artist_id: parsedInput.artist_id,
          platform: parsedInput.platform,
          platform_id: parsedInput.platform_id,
        },
        { onConflict: 'artist_id,platform' }
      );

    if (error) throw new Error(`Error updating platform ID: ${error.message}`);
    return data;
  });

// Delete a platform ID
export const deletePlatform = actionClient
  .schema(
    z.object({
      artist_id: z.string(),
      platform: z.enum(['spotify', 'youtube', 'lastfm', 'musicbrainz']),
    })
  )
  .action(
    async ({
      parsedInput,
    }: {
      parsedInput: {
        artist_id: string;
        platform: 'spotify' | 'youtube' | 'lastfm' | 'musicbrainz';
      };
    }) => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('platformis')
        .delete()
        .eq('artist_id', parsedInput.artist_id)
        .eq('platform', parsedInput.platform);
      if (error) throw new Error(`Error deleting platform ID: ${error.message}`);
      return data;
    }
  );

// Add this to your existing platform.ids.ts file
export const updateArtistPlatformId = actionClient
  .schema(
    z.object({
      artist_id: z.string(),
      platform: z.enum(['spotify', 'youtube', 'lastfm', 'musicbrainz']),
      platform_id: z.string(),
    })
  )
  .action(async ({ parsedInput }) => {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('artist_platform_ids')
      .upsert(
        {
          artist_id: parsedInput.artist_id,
          platform: parsedInput.platform,
          platform_id: parsedInput.platform_id,
        },
        { onConflict: 'artist_id,platform' }
      );

    if (error) {
      console.error('Error updating platform ID:', error);
      throw new Error(`Failed to update platform ID: ${error.message}`);
    }

    return { success: true, data };
  });
