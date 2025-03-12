import { GeniusService } from '@/services/genius-service';
import { createClient } from '@/lib/supabase/server';

export async function PUT() {
  try {
    console.log('Starting Deezer metrics update...');
    const supabase = await createClient();
    
    // Get all artists with their Deezer platform IDs
    const { data: artistPlatformIds, error: platformError } = await supabase
      .from('artist_platform_ids')
      .select('artist_id, platform_id')
      .eq('platform', 'genius');
    
    if (platformError || !artistPlatformIds || artistPlatformIds.length === 0) {
      console.error('Error fetching Deezer platform IDs:', platformError);
      return Response.json({ 
        error: 'No Deezer platform IDs found',
        success: false
      }, { status: 404 });
    }
    
    console.log(`Found ${artistPlatformIds.length} artists with Deezer IDs`);
    
    // Get current timestamp for all metrics
    const timestamp = new Date().toISOString();
    
    // Update metrics for each artist
    const updates = await Promise.all(
      artistPlatformIds.map(async ({ artist_id, platform_id }) => {
        try {
          // Get artist data from Deezer
          const geniusArtist = await GeniusService.getArtistById(platform_id);
          console.log(`Genius response for ${platform_id}:`, geniusArtist);
          
          if (!geniusArtist) {
            return {
              artist_id,
              success: false,
              error: 'Artist not found on Genius'
            };
          }
          
          // Try to access fan count from the response
          // The API might return it directly or nested under 'artist'
          let fanCount: number | undefined;
          
          if (typeof (geniusArtist as any).followers_count === 'number') {
            // Direct access
            fanCount = (geniusArtist as any).followers_count;
            console.log(`Found fan count directly: ${fanCount}`);
          } else if (geniusArtist && typeof geniusArtist.followers_count === 'number') {
            // Nested under 'artist'
            fanCount = geniusArtist.followers_count;
            console.log(`Found fan count in artist object: ${fanCount}`);
          } else {
            console.log('Fan count not found in response:', geniusArtist);
          }
          
          if (typeof fanCount !== 'number') {
            return {
              artist_id,
              success: false,
              error: 'Fan count not available'
            };
          }
          
          // Update the artist_metrics table
          const { error: metricsError } = await supabase
            .from('artist_metrics')
            .upsert({
              artist_id,
              platform: 'genius',
              metric_type: 'followers',
              value: fanCount,
              date: timestamp
            }, {
              onConflict: 'artist_id,platform,metric_type,date'
            });
          
          if (metricsError) {
            console.error('Error updating metrics:', metricsError);
            return {
              artist_id,
              success: false,
              error: metricsError.message
            };
          }
          
          return {
            artist_id,
            success: true,
            fans: fanCount
          };
        } catch (error) {
          console.error(`Error updating metrics for artist ${artist_id}:`, error);
          return {
            artist_id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    const successful = updates.filter(u => u.success);
    const failed = updates.filter(u => !u.success);
    
    return Response.json({
      success: true,
      total: artistPlatformIds.length,
      updated: successful.length,
      failed: failed.length,
      results: updates
    });
  } catch (error) {
    console.error('Error updating Deezer metrics:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 });
  }
}
