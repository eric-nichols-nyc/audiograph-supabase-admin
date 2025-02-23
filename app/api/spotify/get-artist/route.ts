import { NextResponse } from 'next/server';
import { createSpotifyService } from '@/services/spotify-service';
import { updateSpotifyPopularity } from '@/actions/artist';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = decodeURIComponent(searchParams.get('name') || '');

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  try {
    const updateSpotifyPopularityAction = await updateSpotifyPopularity({
      artistName: name
    });

    return NextResponse.json({ updateSpotifyPopularityAction });
  } catch (error) {
    console.error('Spotify search error:', error);
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 }
    );
  }
}