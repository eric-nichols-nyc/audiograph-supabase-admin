import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define the cron schedule (runs daily at 2 AM UTC)
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// This defines when the cron job will run
export const maxDuration = 300; // 5 minutes max duration
export const runtime = 'nodejs';

// This configures the cron schedule
export const preferredRegion = 'iad1'; // Use a region close to your users
export const schedule = '0 2 * * *'; // Daily at 2 AM UTC

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
    
    // Fetch artists with Spotify IDs
    const { data: artistData, error: artistError } = await supabase
      .from('artist_platform_ids')
      .select('platform_id')
      .eq('platform', 'spotify')
      .not('platform_id', 'is', null);
    
    if (artistError) {
      throw artistError;
    }
    
    // Extract just the IDs
    const artistIds = artistData.map(item => item.platform_id);
    
    // Call your scraping endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/scrape/spotify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ artistIds })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to trigger scraping: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process the results
    if (data.results && data.results.length > 0) {
      const processResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/process-spotify-listeners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ results: data.results })
      });
      
      if (!processResponse.ok) {
        throw new Error(`Failed to process results: ${processResponse.statusText}`);
      }
      
      const processData = await processResponse.json();
      
      return NextResponse.json({
        success: true,
        message: 'Spotify metrics collected and processed successfully',
        processed: processData
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No results returned from scraping'
      });
    }
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to run Spotify metrics collection',
      details: error.message
    }, { status: 500 });
  }
} 