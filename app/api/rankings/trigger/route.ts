import { NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rankingService = new RankingService(user.id);
    await rankingService.updateRankings();

    return NextResponse.json({ success: true, message: 'Rankings update triggered successfully' });
  } catch (error) {
    console.error('Error triggering rankings update:', error);
    return NextResponse.json({ error: 'Failed to trigger rankings update' }, { status: 500 });
  }
}
