import { createClient } from '@/lib/supabase/server';
import {createLastfmService} from '@/services/lastfm-service';

export async function PUT() {
  try {
    // Get all artists from our database
    const supabase = await createClient();

    // First, let's check what platforms are in use
    const { data: platforms, error: platformError } = await supabase
      .from('artist_platform_ids')
      .select('platform')
      .limit(1);

    console.log('Existing platforms:', platforms);
    console.log(' platformError = ', platformError);
    // If there are no platforms in use, we can't proceed
    if (!platforms || platforms.length === 0) {
      return new Response('No platforms found', { status: 404 });
    }

    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name');

    if (artistsError || !artists || artists.length === 0) {
      return new Response('No artists found', { status: 404 });
    }

    const lastFm = createLastfmService();

    // Get Deezer data for all artists
    const artistNames = artists.map(a => a.name);


    const lastFmArtists = await Promise.all(
      artistNames.map(async (artistName) => {
        const lastFmArtist = await lastFm.getLastFmArtistInfo(artistName);
        return lastFmArtist;
      } )
    );

    // Update platform IDs for each artist found
    const updates = await Promise.all(
      lastFmArtists.map(async (lastfmArtist, index) => {
        if (lastfmArtist) {
          const artistId = artists[index].id;
          console.log('artist id = ',artistId)
          if(!artistId){
            console.log('No artist id found')
            throw new Error('No artist id found');
          }
          // Update the platformis table with uppercase platform name
          const { error: updateError } = await supabase.from('artist_platform_ids').upsert(
            {
              artist_id: artistId,
              platform: 'musicbrainz', // Try uppercase
              platform_id: lastfmArtist.musicbrainz_id,
            },
            {
              onConflict: 'artist_id,platform',
            }
          );

          if (updateError) {
            console.error('Error updating platform ID:', updateError);
            return {
              name: artists[index].name,
              success: false,
              error: updateError.message,
            };
          }

          // update metrics for monthly listeners and total plays
          const { error: metricsError } = await supabase.from('artist_metrics').upsert({ 
            artist_id: artistId,
            platform:'musicbrainz', // Try uppercase
            metric_type:'monthly_listeners',
            value: lastfmArtist.lastfm_monthly_listeners,
            date: new Date().toISOString(),
          });
          if (metricsError) {
            console.error('Error updating metrics for monthly listeners:', metricsError);
          }

          // update metrics for total streams
          const { error: totalStreamsError } = await supabase.from('artist_metrics').upsert({ 
            artist_id: artistId,
            platform:'musicbrainz', // Try uppercase
            metric_type:'total_streams',
            value: lastfmArtist.lastfm_play_count,
            date: new Date().toISOString(),
          });
          if (totalStreamsError) { 
            console.error('Error updating metrics for total streams:', totalStreamsError);
          }

          return {
            name: artists[index].name,
            success: true,
            artistId: artistId,
            musicbrainz_id: lastfmArtist.musicbrainz_id,
          };
        }
        return {
          name: artists[index].name,
          success: false,
        };
      })
    );

    return Response.json({
      total: artists.length,
      updated: updates.filter(u => u.success).length,
      results: updates,
    });
  } catch (error) {
    console.error('Error updating Lastfm:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
