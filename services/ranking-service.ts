import { Artist } from '@/types/artists';
import { createClient } from '@/lib/supabase/server';
import { NotificationService } from './notification-service';
import { getUser } from '@/lib/supabase/auth/server';

export class RankingService {
  constructor() {
    this.notificationService = new NotificationService();
  }

  public notificationService: NotificationService;

  async updateRankings(): Promise<void> {
    const supabase = await createClient();

    try {
      const { error } = await supabase.rpc('calculate_artist_rankings');
      if (error) throw error;

      await this.notificationService.createNotification({
        type: 'success',
        title: 'Rankings Updated',
        message: 'Artist rankings have been successfully updated',
        metadata: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      await this.notificationService.createNotification({
        type: 'error',
        title: 'Ranking Update Failed',
        message: 'Failed to update artist rankings',
        priority: 1, // Higher priority for errors
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        },
      });
      throw error;
    }
  }

  async getTrendingArtists(limit: number = 10, timeRange: string = '7 days'): Promise<Artist[]> {
    try {
      const supabase = await createClient();

      const { data, error } = await supabase.rpc('get_trending_artists', {
        limit_count: limit,
        time_range: timeRange,
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
      const supabase = await createClient();
      const { data, error } = await supabase.rpc('calculate_artist_score', { artist_id: artistId });

      if (error) throw error;
      return data as number;
    } catch (error) {
      console.error('Error calculating artist score:', error);
      throw error;
    }
  }
}
