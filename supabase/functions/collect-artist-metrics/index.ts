// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import Supabase Edge Function types
import { serve } from "std/http/server.ts"
import { createClient } from "@supabase/supabase-js"
import { google } from 'npm:googleapis'

// Initialize YouTube client
const youtube = google.youtube('v3')

interface RequestEvent {
  request: Request;
}

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all artists with their platform IDs from database
    const { data: artistPlatforms, error: artistError } = await supabase
      .from('artist_platform_ids')
      .select('artist_id, platform_id, platform')
      .not('platform_id', 'is', null)

    if (artistError) throw artistError

    // Process each artist platform
    for (const artistPlatform of artistPlatforms) {
      try {
        // Get YouTube subscribers
        if (artistPlatform.platform === 'youtube') {
          const response = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${artistPlatform.platform_id}&key=${Deno.env.get('YOUTUBE_API_KEY')}`,
            { method: 'GET' }
          )
          
          const data = await response.json()
          const subscriberCount = data.items?.[0]?.statistics?.subscriberCount

          if (subscriberCount) {
            await supabase.from('artist_metrics').insert({
              artist_id: artistPlatform.artist_id,
              platform: 'youtube',
              metric_type: 'subscribers',
              value: parseInt(subscriberCount)
            })
          }
        }

        // Spotify metrics collection can be added here when ready
        if (artistPlatform.platform === 'spotify') {
          // You'll need to call your Spotify service here
          // For now, let's skip Spotify
        }
      } catch (platformError) {
        console.error(`Error processing artist ${artistPlatform.artist_id} platform ${artistPlatform.platform}:`, platformError)
        continue
      }
    }

    return new Response('Metrics collected successfully', { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error collecting metrics:', error)
    return new Response(JSON.stringify({ error: 'Failed to collect metrics' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/collect-artist-metrics' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
