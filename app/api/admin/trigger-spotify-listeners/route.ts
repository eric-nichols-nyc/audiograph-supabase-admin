import { NextRequest, NextResponse } from 'next/server';

// Securely get API token - should be in your environment variables
const API_TOKEN = process.env.BRIGHT_DATA_API_TOKEN;
const COLLECTOR_ID = process.env.BRIGHT_DATA_COLLECTOR_ID || "c_m7o1my9x1u3cmu5hhc";

export async function POST(request: NextRequest) {
  try {
    // Call the Bright Data endpoint to trigger a collection
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/artists/scrape/bright-data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to trigger Bright Data collection: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Pass through the response from the Bright Data endpoint
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error triggering Spotify listeners collection:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Spotify listeners collection', details: error.message }, 
      { status: 500 }
    );
  }
}

// Separate endpoint to check scraping results
export async function GET(request: Request) {
  const url = new URL(request.url);
  const datasetId = url.searchParams.get('datasetId');
  
  console.log('Bright Data endpoint called', { datasetId });
  
  // If no datasetId is provided, trigger a new collection
  if (!datasetId) {
    return NextResponse.json({
      status: 'success',
      message: 'Collection started',
      datasetId: 'test-dataset-id-' + Date.now()
    });
  }
  
  // If datasetId is provided, return mock results after a delay
  // For testing, we'll return results immediately for dataset IDs that are older than 10 seconds
  const idTimestamp = parseInt(datasetId.split('-').pop() || '0');
  const now = Date.now();
  const elapsedMs = now - idTimestamp;
  
  if (elapsedMs < 10000) {
    // Still "processing"
    return NextResponse.json({
      status: 'processing',
      message: 'Collection in progress'
    });
  }
  
  // Return mock results
  return NextResponse.json({
    status: 'success',
    message: 'Collection complete',
    results: [
      {
        name: 'Test Artist 1',
        spotifyId: '1234567890',
        listeners: 1000000
      },
      {
        name: 'Test Artist 2',
        spotifyId: '0987654321',
        listeners: 500000
      }
    ]
  });
}

// This is what we expect this endpoint to do:
// 1. When called with no datasetId, it should trigger a new collection and return a datasetId
// 2. When called with a datasetId, it should check the status and return results if available