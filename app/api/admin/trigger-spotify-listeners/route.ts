import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { metricsStore } from '@/lib/metrics-store';

export async function POST() {
  try {
    // Step 1: Trigger the Bright Data collection
    const triggerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/artists/scrape/bright-data`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!triggerResponse.ok) {
      throw new Error(`Failed to trigger Bright Data collection: ${triggerResponse.statusText}`);
    }
    
    const triggerData = await triggerResponse.json();
    const datasetId = triggerData.datasetId;
    
    if (!datasetId) {
      throw new Error('No dataset ID returned from Bright Data trigger');
    }
    
    // Step 2: Return the dataset ID to the client
    return NextResponse.json({ 
      success: true, 
      message: 'Spotify listeners collection triggered successfully',
      datasetId,
      status: 'running'
    });
  } catch (error) {
    console.error('Error triggering Spotify listeners collection:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Spotify listeners collection', details: error.message }, 
      { status: 500 }
    );
  }
} 