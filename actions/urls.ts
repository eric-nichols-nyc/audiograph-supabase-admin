'use server';

import { actionClient } from '@/lib/safe-action';
import { createClient } from '../lib/supabase//server';
import { z } from 'zod';
import { ArtistUrl } from '../types/artists';

// Schema for ArtistUrl
export const urlSchema = z.object({
  artist_id: z.string(),
  platform: z.enum(['spotify', 'youtube', 'instagram', 'tiktok', 'facebook', 'viberate']),
  url: z.string(),
  created_at: z.string().optional(),
});

// Fetch URLs
export const getUrls = actionClient.action(async (): Promise<ArtistUrl[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from<ArtistUrl>('urls').select('*');
  if (error) throw new Error(`Error fetching URLs: ${error.message}`);
  return data;
});

// Add a URL
export const addUrl = actionClient
  .schema(urlSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistUrl }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from('urls').insert(parsedInput);
    if (error) throw new Error(`Error adding URL: ${error.message}`);
    return data;
  });

// Update a URL
export const updateUrl = actionClient
  .schema(urlSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistUrl }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('urls')
      .update(parsedInput)
      .eq('artist_id', parsedInput.artist_id)
      .eq('platform', parsedInput.platform);
    if (error) throw new Error(`Error updating URL: ${error.message}`);
    return data;
  });

// Delete a URL
export const deleteUrl = actionClient
  .schema(
    z.object({
      artist_id: z.string(),
      platform: z.enum(['spotify', 'youtube', 'instagram', 'tiktok', 'facebook', 'viberate']),
    })
  )
  .action(
    async ({
      parsedInput,
    }: {
      parsedInput: {
        artist_id: string;
        platform: 'spotify' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'viberate';
      };
    }) => {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('urls')
        .delete()
        .eq('artist_id', parsedInput.artist_id)
        .eq('platform', parsedInput.platform);
      if (error) throw new Error(`Error deleting URL: ${error.message}`);
      return data;
    }
  );
