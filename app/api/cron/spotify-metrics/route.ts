import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Call your Supabase function
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
    console.log('Spotify metrics collection result:', result);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 