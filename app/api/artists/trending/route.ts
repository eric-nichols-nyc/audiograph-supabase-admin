import { NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking-service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const rankingService = new RankingService();
    const trendingArtists = await rankingService.getTrendingArtists(limit);
    
    return NextResponse.json(trendingArtists);
  } catch (error) {
    console.error('Error fetching trending artists:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending artists' },
      { status: 500 }
    );
  }
} 