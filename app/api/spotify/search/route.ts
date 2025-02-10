import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

const spotify = new SpotifyWebApi({
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_ID,
  clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_SECRET
});

async function refreshSpotifyToken() {
  const data = await spotify.clientCredentialsGrant();
  spotify.setAccessToken(data.body['access_token']);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    await refreshSpotifyToken();
    
    const response = await spotify.searchArtists(query, { limit: 10 });
    const artists = response.body.artists?.items.map(artist => ({
      spotify_id: artist.id,
      name: artist.name,
      image_url: artist.images?.[0]?.url,
      genres: artist.genres,
      popularity: artist.popularity,
      followers: artist.followers.total
    })) || [];

    return NextResponse.json({ artists });
  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}