import { Artist } from "@/types/artists";
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export class RankingService {
  async updateRankings(): Promise<void> {
    try {
      const { error } = await supabase.rpc('calculate_artist_rankings');
      if (error) throw error;
    } catch (error) {
      console.error('Error updating rankings:', error);
      throw error;
    }
  }

  async getTrendingArtists(
    limit: number = 10,
    timeRange: string = '7 days'
  ): Promise<Artist[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_artists', { 
          limit_count: limit,
          time_range: timeRange 
        });

      if (error) throw error;
      return data as Artist[];
    } catch (error) {
      console.error('Error fetching trending artists:', error);
      throw error;
    }
  }

  async getArtistScore(artistId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_artist_score', { artist_id: artistId });

      if (error) throw error;
      return data as number;
    } catch (error) {
      console.error('Error calculating artist score:', error);
      throw error;
    }
  }
} 