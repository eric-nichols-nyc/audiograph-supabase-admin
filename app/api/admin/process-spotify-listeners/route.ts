import { NextResponse } from 'next/server';
import { metricsStore } from '@/lib/metrics-store';

export async function POST(request: Request) {
  try {
    console.log('Process Spotify listeners endpoint called');
    
    const { results } = await request.json();
    console.log('Received results:', results);
    
    // For testing, just log the results and notify about completion
    metricsStore.addUpdate({
      type: 'spotify-listeners',
      status: 'completed',
      timestamp: new Date().toISOString(),
      artistsProcessed: results.length,
    });
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} results`,
      updatedCount: results.length
    });
  } catch (error) {
    console.error('Error processing Spotify listeners:', error);
    return NextResponse.json(
      { error: 'Failed to process Spotify listeners', details: error.message }, 
      { status: 500 }
    );
  }
} 