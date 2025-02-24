import { NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking-service';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// This endpoint will be called daily at midnight UTC
export const config = {
  cron: '0 0 * * *'
};

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rankingService = new RankingService(user.id);
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