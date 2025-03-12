import { DeezerService } from '@/services/deezer-service';
import { createClient } from '@/lib/supabase/server';

export async function PUT() {
  console.log('PUT');
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

    // Get Deezer data for all artists
    const deezerArtists = await DeezerService.getArtistIds(artists.map(a => a.name));

    // Update platform IDs for each artist found
    const updates = await Promise.all(
      deezerArtists.map(async (deezerArtist, index) => {
        if (deezerArtist) {
          console.log('deezerArtist = ', deezerArtist);
          const artistId = artists[index].id;
          // Update the platformis table with uppercase platform name
          const { error: updateError } = await supabase.from('artist_platform_ids').upsert(
            {
              artist_id: artistId,
              platform: 'deezer', // Try uppercase
              platform_id: deezerArtist.id.toString(),
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

          return {
            name: artists[index].name,
            success: true,
            deezerId: deezerArtist.id,
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
    console.error('Error updating Deezer IDs:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
