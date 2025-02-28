import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Call your Supabase function to collect Spotify listeners
    const response = await fetch(
      'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/collect-artist-spotify-listeners',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({})
      }
    );
    
    const result = await response.json();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Spotify listeners collection triggered successfully',
      result 
    });
  } catch (error) {
    console.error('Error triggering Spotify listeners collection:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Spotify listeners collection' }, 
      { status: 500 }
    );
  }
} 