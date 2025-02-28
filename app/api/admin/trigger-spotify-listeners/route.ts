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
        body: JSON.stringify({}),
        // Add a timeout to prevent hanging
        signal: AbortSignal.timeout(60000) // 30 second timeout
      }
    );
    
    // Check if the response is OK
    if (!response.ok) {
      console.error('Error response from Supabase function:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      throw new Error(`Function returned error: ${response.status} ${response.statusText}`);
    }
    
    // Try to parse the response as JSON, but handle errors
    let result;
    try {
      const text = await response.text();
      console.log('Raw response:', text);
      result = text ? JSON.parse(text) : {};
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      // Return success anyway since the function was triggered
      return NextResponse.json({ 
        success: true, 
        message: 'Spotify listeners collection triggered successfully, but response could not be parsed',
        rawResponse: await response.text()
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Spotify listeners collection triggered successfully',
      result 
    });
  } catch (error) {
    console.error('Error triggering Spotify listeners collection:', error);
    return NextResponse.json(
      { error: 'Failed to trigger Spotify listeners collection', details: error.message }, 
      { status: 500 }
    );
  }
} 