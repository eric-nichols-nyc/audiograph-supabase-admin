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

// Add Spotify token fetching function
async function getSpotifyAccessToken() {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID')
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET')
  
  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials')
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  return data.access_token
}

serve(async (req: Request) => {
  // Add check for cron job
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.includes('Bearer')) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get Spotify access token once before processing artists
    let spotifyAccessToken: string | null = null
    try {
      spotifyAccessToken = await getSpotifyAccessToken()
    } catch (error) {
      console.error('Failed to get Spotify access token:', error)
    }

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

        // Add Spotify metrics collection
        if (artistPlatform.platform === 'spotify' && spotifyAccessToken) {
          const response = await fetch(
            `https://api.spotify.com/v1/artists/${artistPlatform.platform_id}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${spotifyAccessToken}`
              }
            }
          )
          
          const data = await response.json()
          const followerCount = data.followers?.total

          if (followerCount !== undefined) {
            await supabase.from('artist_metrics').insert({
              artist_id: artistPlatform.artist_id,
              platform: 'spotify',
              metric_type: 'followers',
              value: followerCount
            })
          }
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

/* To invoke via cron:

1. Enable the function in the Supabase dashboard
2. Go to Database → Functions → Triggers
3. Create a new cron trigger with:
   - Name: collect_artist_metrics_cron
   - Schedule: 0 0 */2 * * (runs at midnight every other day)
   - Function to trigger: collect-artist-metrics
*/
