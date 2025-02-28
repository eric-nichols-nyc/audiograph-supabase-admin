import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { metricsStore } from '@/lib/metrics-store';

export async function POST(request: Request) {
  try {
    const { results } = await request.json();
    
    if (!results || !Array.isArray(results)) {
      return NextResponse.json(
        { error: 'Invalid results data' }, 
        { status: 400 }
      );
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Fetch artists with Spotify IDs from the database
    const { data: artistPlatforms, error: artistError } = await supabase
      .from('artist_platform_ids')
      .select('artist_id, platform_id, platform')
      .eq('platform', 'spotify')
      .not('platform_id', 'is', null);
    
    if (artistError) {
      console.error('Error fetching artist platforms:', artistError);
      throw artistError;
    }
    
    console.log(`Found ${artistPlatforms?.length || 0} artists with Spotify IDs in database`);
    
    // Process each artist and update metrics
    let updatedCount = 0;
    const timestamp = new Date().toISOString();
    
    for (const artistPlatform of artistPlatforms || []) {
      // Find matching artist in results
      const matchingResult = results.find(
        (result: any) => result.spotifyId === artistPlatform.platform_id
      );
      
      if (matchingResult && matchingResult.listeners) {
        // Insert the metric into the database
        const { error: insertError } = await supabase
          .from('artist_metrics')
          .insert({
            artist_id: artistPlatform.artist_id,
            platform: 'spotify',
            metric_type: 'monthly_listeners',
            value: matchingResult.listeners,
            date: timestamp
          });
        
        if (insertError) {
          console.error(`Error inserting metric for artist ${artistPlatform.artist_id}:`, insertError);
          continue;
        }
        
        updatedCount++;
      }
    }
    
    // Notify about completion via the metrics store
    metricsStore.addUpdate({
      type: 'spotify-listeners',
      status: 'completed',
      timestamp: new Date().toISOString(),
      artistsProcessed: updatedCount,
    });
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updatedCount} artists with Spotify monthly listeners`,
      updatedCount
    });
  } catch (error) {
    console.error('Error processing Spotify listeners:', error);
    return NextResponse.json(
      { error: 'Failed to process Spotify listeners', details: error.message }, 
      { status: 500 }
    );
  }
} 