import { createClient } from '@/utils/supabase/server';

export interface Artist {
  id: string;
  name: string;
  // Add other fields as needed
}

export interface ArtistPlatformId {
  id: string;
  artist_id: string;
  platform: string;
  platform_id: string;
}

export interface ArtistMetric {
  id?: string;
  artist_id: string;
  platform: string;
  metric_type: string;
  value: number;
  // Removed timestamp field as it doesn't exist in the database
}

export class ArtistService {
  async getAllArtists(): Promise<Artist[]> {
    const supabase = createClient();
    const { data, error } = await supabase.from('artists').select('*');

    if (error) {
      console.error('Error fetching artists:', error);
      throw error;
    }

    return data || [];
  }

  async getSpotifyPlatformIds(): Promise<ArtistPlatformId[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('artist_platform_ids')
      .select('*')
      .eq('platform', 'spotify');

    if (error) {
      console.error('Error fetching Spotify platform IDs:', error);
      throw error;
    }

    return data || [];
  }

  async updateArtistMetrics(metrics: ArtistMetric[]): Promise<void> {
    if (!metrics.length) return;

    const supabase = createClient();

    // Batch the inserts in groups of 100 to avoid potential payload size limits
    for (let i = 0; i < metrics.length; i += 100) {
      const batch = metrics.slice(i, i + 100);

      const { error } = await supabase.from('artist_metrics').upsert(batch, {
        onConflict: 'artist_id,platform,metric_type',
        ignoreDuplicates: false,
      });

      if (error) {
        console.error('Error updating artist metrics:', error);
        throw error;
      }
    }

    console.log(`Updated ${metrics.length} artist metrics successfully`);
  }
}

export const artistService = new ArtistService();
