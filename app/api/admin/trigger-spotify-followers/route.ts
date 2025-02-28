import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Call your Supabase function to collect Spotify followers
    const response = await fetch(
      'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/collect-artist-spotify-followers',
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
      message: 'Spotify followers collection triggered successfully',
      result 
    });
  } catch (error) {
    console.error('Error triggering Spotify followers collection:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Spotify followers collection' }, 
      { status: 500 }
    );
  }
} 