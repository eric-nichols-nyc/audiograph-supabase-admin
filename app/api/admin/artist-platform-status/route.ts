import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Get all artists
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, slug');
      
    if (artistsError) {
      throw artistsError;
    }
    
    // Get all platform IDs
    const { data: platformIds, error: platformError } = await supabase
      .from('artist_platform_ids')
      .select('artist_id, platform, platform_id');
      
    if (platformError) {
      throw platformError;
    }
    
    // Process the data to create the response format
    const artistsWithPlatforms = artists.map(artist => {
      const artistPlatforms = platformIds.filter(p => p.artist_id === artist.id);
      
      const spotifyPlatform = artistPlatforms.find(p => p.platform === 'spotify');
      const youtubePlatform = artistPlatforms.find(p => p.platform === 'youtube');
      
      return {
        id: artist.id,
        name: artist.name,
        hasSpotify: !!spotifyPlatform,
        hasYoutube: !!youtubePlatform,
        spotifyId: spotifyPlatform?.platform_id,
        youtubeId: youtubePlatform?.platform_id
      };
    });
    
    return NextResponse.json({ 
      artists: artistsWithPlatforms 
    });
  } catch (error) {
    console.error('Error fetching artist platform status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch artist platform status' }, 
      { status: 500 }
    );
  }
} 