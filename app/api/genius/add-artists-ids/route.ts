import { GeniusService } from '@/services/genius-service';
import { createClient } from '@/lib/supabase/server';

export async function PUT() {
  
  try {
    // Initialize Supabase client
    const supabase = await createClient();

    // Check what platforms are in use
    const { data: platforms, error: platformError } = await supabase
      .from('artist_platform_ids')
      .select('platform')
      .limit(1);

    console.log('Existing platforms:', platforms);
    if (platformError) {
      console.error('Platform fetch error:', platformError);
      return new Response('Error fetching platforms', { status: 500 });
    }

    if (!platforms || platforms.length === 0) {
      return new Response('No platforms found', { status: 404 });
    }

    // Fetch all artists from the database
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name');

    if (artistsError) {
      console.error('Artists fetch error:', artistsError);
      return new Response('Error fetching artists', { status: 500 });
    }

    if (!artists || artists.length === 0) {
      return new Response('No artists found', { status: 404 });
    }

    // Get Genius data for all artists
    const geniusArtists = await GeniusService.getMultipleArtistsInfo(
      artists.map(a => a.name)
    );

    geniusArtists.forEach(info => {
      if (info) {
        console.log(`ID: ${info.id}, Name: ${info.name}, Image: ${info.image_url}`);
      }
    });

    // Update platform IDs for each artist found
    const updates = await Promise.all(
      geniusArtists.map(async (geniusArtist, index) => {
        if (geniusArtist) {
          console.log('Genius Artist:', geniusArtist);
          const artistId = artists[index].id;

          // Update the artist_platform_ids table with Genius data
          const { error: updateError } = await supabase.from('artist_platform_ids').upsert(
            {
              artist_id: artistId,
              platform: 'genius',
              platform_id: geniusArtist.id.toString(),
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
            geniusId: geniusArtist.id,
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
    console.error('Error updating Genius IDs:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
