import { NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking-service';

export async function POST() {
  try {
    const rankingService = new RankingService();
    await rankingService.updateAllArtistRankings();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rankings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json(
      { error: 'Failed to update rankings' },
      { status: 500 }
    );
  }
} 