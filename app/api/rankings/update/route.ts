import { NextResponse } from 'next/server';
import { RankingService } from '@/services/ranking-service';
import { createClient } from "@/utils/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rankingService = new RankingService(user.id);
  await rankingService.updateRankings();
  
  return NextResponse.json({ 
    success: true, 
    message: 'Rankings updated successfully' 
  });
} 