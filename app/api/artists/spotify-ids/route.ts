import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Fetch artists with Spotify IDs
    const { data, error } = await supabase
      .from('artist_platform_ids')
      .select('platform_id')
      .eq('platform', 'spotify')
      .not('platform_id', 'is', null);
    
    if (error) {
      throw error;
    }
    
    // Extract just the IDs
    const artistIds = data.map(item => item.platform_id);
    
    return NextResponse.json({
      success: true,
      artistIds,
      count: artistIds.length
    });
  } catch (error) {
    console.error('Error fetching Spotify artist IDs:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch Spotify artist IDs',
      details: error.message 
    }, { status: 500 });
  }
} 