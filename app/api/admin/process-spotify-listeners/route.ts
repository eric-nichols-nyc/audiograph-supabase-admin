import { NextResponse } from 'next/server';
import { metricsStore } from '@/lib/metrics-store';
import { logActivity } from '@/lib/activity-logger';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('Process Spotify listeners endpoint called');

    const { results } = await request.json();
    console.log('Received results:', results);

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Process the results and update the database
    let updatedCount = 0;

    for (const result of results) {
      if (result.spotifyId && result.listeners) {
        // Find the artist_id for this Spotify ID
        const { data: artistData } = await supabase
          .from('artist_platform_ids')
          .select('artist_id')
          .eq('platform', 'spotify')
          .eq('platform_id', result.spotifyId)
          .single();

        if (artistData?.artist_id) {
          // Insert the metric
          const { error } = await supabase.from('artist_metrics').insert({
            artist_id: artistData.artist_id,
            platform: 'spotify',
            metric_type: 'monthly_listeners',
            value: result.listeners,
            collected_at: new Date().toISOString(),
          });

          if (!error) {
            updatedCount++;
          }
        }
      }
    }

    // Log the activity
    await logActivity({
      type: 'success',
      message: 'Spotify listeners collection completed',
      platform: 'spotify',
      details: `Updated ${updatedCount} artists`,
    });

    // Notify through metrics store
    metricsStore.addUpdate({
      type: 'spotify-listeners',
      status: 'completed',
      timestamp: new Date().toISOString(),
      artistsProcessed: updatedCount,
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} results, updated ${updatedCount} artists`,
      updatedCount,
    });
  } catch (error) {
    // Log the error activity
    await logActivity({
      type: 'error',
      message: 'Spotify listeners collection failed',
      platform: 'spotify',
      details: error.message,
    });

    console.error('Error processing Spotify listeners:', error);
    return NextResponse.json(
      { error: 'Failed to process Spotify listeners', details: error.message },
      { status: 500 }
    );
  }
}
