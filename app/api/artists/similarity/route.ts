import { NextResponse } from 'next/server';
import { ArtistSimilarityService } from '@/services/artist-similarity-service';

export async function POST(request: Request) {
  try {
    const { artist1Id, artist2Id } = await request.json();

    if (!artist1Id || !artist2Id) {
      return NextResponse.json(
        { error: 'Both artist IDs are required' }, 
        { status: 400 }
      );
    }

    const similarityService = new ArtistSimilarityService();
    const score = await similarityService.getSimilarityScore(artist1Id, artist2Id);

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Error calculating similarity:', error);
    return NextResponse.json(
      { error: 'Failed to calculate similarity' }, 
      { status: 500 }
    );
  }
} 