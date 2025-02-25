// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import Supabase Edge Function types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"


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

const BATCH_SIZE = 10; // Process 10 artists at a time

serve(async (req: Request) => {
  try {
    console.log('Function invoked - START')
    
    // Immediately check and log env vars
    const envVars = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: 'exists: ' + !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      YOUTUBE_API_KEY: 'exists: ' + !!Deno.env.get('YOUTUBE_API_KEY'),
      SPOTIFY_CLIENT_ID: 'exists: ' + !!Deno.env.get('SPOTIFY_CLIENT_ID'),
      SPOTIFY_CLIENT_SECRET: 'exists: ' + !!Deno.env.get('SPOTIFY_CLIENT_SECRET')
    }
    
    console.log('Environment variables check:', envVars)
    
    if (!envVars.SUPABASE_URL || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Missing required Supabase environment variables')
    }

    // Check authorization
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'present' : 'missing')

    if (!authHeader || !authHeader.includes('Bearer')) {
      throw new Error('Unauthorized: Missing or invalid auth header')
    }

    console.log('Starting metrics collection...')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Log environment variables (without revealing sensitive data)
    console.log('Environment check:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasYoutubeKey: !!Deno.env.get('YOUTUBE_API_KEY'),
      hasSpotifyId: !!Deno.env.get('SPOTIFY_CLIENT_ID'),
      hasSpotifySecret: !!Deno.env.get('SPOTIFY_CLIENT_SECRET')
    })

    // Get all artists but process in batches
    console.log('Fetching artist platforms...')
    const { data: artistPlatforms, error: artistError } = await supabase
      .from('artist_platform_ids')
      .select('artist_id, platform_id, platform')
      .not('platform_id', 'is', null)
    
    console.log('Artist platforms query result:', {
      hasData: !!artistPlatforms,
      count: artistPlatforms?.length ?? 0,
      error: artistError
    })

    if (artistError) {
      console.error('Error fetching artist platforms:', artistError)
      throw artistError
    }

    if (!artistPlatforms || artistPlatforms.length === 0) {
      console.log('No artist platforms found')
      return new Response('No artist platforms to process', { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get Spotify token once for all batches
    let spotifyAccessToken: string | null = null
    try {
      spotifyAccessToken = await getSpotifyAccessToken()
    } catch (error) {
      console.error('Failed to get Spotify access token:', error)
    }

    // Process in batches
    for (let i = 0; i < artistPlatforms.length; i += BATCH_SIZE) {
      console.log(`Processing batch ${i/BATCH_SIZE + 1}`)
      const batch = artistPlatforms.slice(i, i + BATCH_SIZE)
      
      // Process each artist in the batch
      for (const artistPlatform of batch) {
        try {
          // Get YouTube subscribers
          if (artistPlatform.platform === 'youtube') {
            console.log(`Fetching YouTube metrics for artist ${artistPlatform.artist_id} with platform ID ${artistPlatform.platform_id}`);
            
            const response = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${artistPlatform.platform_id}&key=${Deno.env.get('YOUTUBE_API_KEY')}`,
              { method: 'GET' }
            )
            
            const data = await response.json()
            console.log('YouTube API response:', data);
            
            const subscriberCount = data.items?.[0]?.statistics?.subscriberCount
            console.log('Subscriber count:', subscriberCount);

            if (subscriberCount) {
              const timestamp = new Date().toISOString()
              const result = await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'youtube',
                metric_type: 'subscribers',
                value: parseInt(subscriberCount),
                date: timestamp
              })
              console.log('Insert result:', result);
            } else {
              console.log('No subscriber count found for this channel');
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
              const timestamp = new Date().toISOString()
              await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'spotify',
                metric_type: 'followers',
                value: followerCount,
                date: timestamp
              })
            }
          }
        } catch (platformError) {
          console.error(`Error processing artist ${artistPlatform.artist_id} platform ${artistPlatform.platform}:`, platformError)
          continue
        }
      }
    }

    console.log('Metrics collection completed successfully')
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


