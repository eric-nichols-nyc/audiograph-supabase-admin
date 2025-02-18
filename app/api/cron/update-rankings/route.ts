import { NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking-service';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// This endpoint will be called daily at midnight UTC
export const config = {
  cron: '0 0 * * *'
};

export async function GET() {
  try {
    const rankingService = new RankingService();
    await rankingService.updateRankings();
    
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