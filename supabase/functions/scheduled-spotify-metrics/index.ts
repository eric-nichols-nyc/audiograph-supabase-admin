import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (_req) => {
  try {
    // Call your collect-artist-spotify-listeners function
    const response = await fetch(
      'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/collect-artist-spotify-listeners',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
        },
        // You can pass an empty object since your function will handle scraping
        body: JSON.stringify({})
      }
    );
    
    const result = await response.json();
    console.log('Spotify metrics collection result:', result);
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error in scheduled function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}) 