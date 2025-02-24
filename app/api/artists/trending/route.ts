import { NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking-service';
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const rankingService = new RankingService(user.id);
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