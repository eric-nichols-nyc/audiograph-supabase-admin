import { NextResponse } from 'next/server';
import { ArtistSimilarityService } from '@/services/artist-similarity-service';

export async function GET(
  request: Request,
  { params }: { params: { artist_id: string } }
) {
  if (!params.artist_id) {
    return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
  }

  try {
    const similarityService = new ArtistSimilarityService();
    const similarArtists = await similarityService.findSimilarArtistsWithScores(params.artist_id);

    return NextResponse.json({ similarArtists });
  } catch (error) {
    console.error('Error finding similar artists:', error);
    return NextResponse.json({ error: 'Failed to find similar artists' }, { status: 500 });
  }
} 