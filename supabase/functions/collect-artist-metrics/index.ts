/**
 * Collect Artist Metrics Edge Function
 *
 * This function collects and stores metrics for artists from various platforms:
 * - YouTube: Subscriber counts
 * - Spotify: Follower counts
 * - Deezer: Fan counts
 * - Genius: Follower counts
 *
 * Process Flow:
 * 1. Fetches artist platform IDs from 'artist_platform_ids' table
 * 2. Processes artists in batches of 10 to avoid rate limits
 * 3. For each platform:
 *    - YouTube: Fetches subscriber count via YouTube Data API
 *    - Spotify: Fetches follower count via Spotify Web API
 *    - Deezer: Fetches fan count via Deezer API
 *    - Genius: Fetches follower count via Genius API
 * 4. Stores metrics in 'artist_metrics' table
 * 5. Logs activity and sends notifications on completion/failure
 *
 * Required Environment Variables:
 * - SUPABASE_URL: Supabase project URL
 * - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 * - YOUTUBE_API_KEY: YouTube Data API key
 * - SPOTIFY_CLIENT_ID: Spotify API client ID
 * - SPOTIFY_CLIENT_SECRET: Spotify API client secret
 * - GENIUS_ACCESS_TOKEN: Genius API access token
 *
 * Database Tables Used:
 * - artist_platform_ids: Source of platform IDs
 * - artist_metrics: Stores collected metrics
 * - activity_logs: Logs function execution
 * - notifications: Stores completion/error notifications
 */

// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

// Import Supabase Edge Function types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

import { google } from 'npm:googleapis';

// Initialize YouTube client
const youtube = google.youtube('v3');

interface RequestEvent {
  request: Request;
}

// Add Spotify token fetching function
async function getSpotifyAccessToken() {
  const clientId = Deno.env.get('SPOTIFY_CLIENT_ID');
  const clientSecret = Deno.env.get('SPOTIFY_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Missing Spotify credentials');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  return data.access_token;
}

const BATCH_SIZE = 10; // Process 10 artists at a time

serve(async (req: Request) => {
  try {
    console.log('Function invoked - START');

    // Immediately check and log env vars
    const envVars = {
      SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: 'exists: ' + !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      YOUTUBE_API_KEY: 'exists: ' + !!Deno.env.get('YOUTUBE_API_KEY'),
      SPOTIFY_CLIENT_ID: 'exists: ' + !!Deno.env.get('SPOTIFY_CLIENT_ID'),
      SPOTIFY_CLIENT_SECRET: 'exists: ' + !!Deno.env.get('SPOTIFY_CLIENT_SECRET'),
      GENIUS_ACCESS_TOKEN: 'exists: ' + !!Deno.env.get('GENIUS_ACCESS_TOKEN'),
    };

    console.log('Environment variables check:', envVars);

    if (!envVars.SUPABASE_URL || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
      throw new Error('Missing required Supabase environment variables');
    }

    // Check authorization
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header:', authHeader ? 'present' : 'missing');

    if (!authHeader || !authHeader.includes('Bearer')) {
      throw new Error('Unauthorized: Missing or invalid auth header');
    }

    console.log('Starting metrics collection...');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Log environment variables (without revealing sensitive data)
    console.log('Environment check:', {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
      hasYoutubeKey: !!Deno.env.get('YOUTUBE_API_KEY'),
      hasSpotifyId: !!Deno.env.get('SPOTIFY_CLIENT_ID'),
      hasSpotifySecret: !!Deno.env.get('SPOTIFY_CLIENT_SECRET'),
      hasGeniusToken: !!Deno.env.get('GENIUS_ACCESS_TOKEN'),
    });

    // Get all artists but process in batches
    console.log('Fetching artist platforms...');
    const { data: artistPlatforms, error: artistError } = await supabase
      .from('artist_platform_ids')
      .select('artist_id, platform_id, platform')
      .not('platform_id', 'is', null);

    console.log('Artist platforms query result:', {
      hasData: !!artistPlatforms,
      count: artistPlatforms?.length ?? 0,
      error: artistError,
    });

    if (artistError) {
      console.error('Error fetching artist platforms:', artistError);
      throw artistError;
    }

    if (!artistPlatforms || artistPlatforms.length === 0) {
      console.log('No artist platforms found');
      return new Response('No artist platforms to process', {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get Spotify token once for all batches
    let spotifyAccessToken: string | null = null;
    try {
      spotifyAccessToken = await getSpotifyAccessToken();
    } catch (error) {
      console.error('Failed to get Spotify access token:', error);
    }

    // Add counters at the beginning of your function
    let youtubeCount = 0;
    let spotifyCount = 0;
    let deezerCount = 0;
    let geniusCount = 0;

    // Process in batches
    for (let i = 0; i < artistPlatforms.length; i += BATCH_SIZE) {
      console.log(`Processing batch ${i / BATCH_SIZE + 1}`);
      const batch = artistPlatforms.slice(i, i + BATCH_SIZE);

      // Process each artist in the batch
      for (const artistPlatform of batch) {
        try {
          // Get YouTube subscribers
          if (artistPlatform.platform === 'youtube') {
            console.log(
              `Fetching YouTube metrics for artist ${artistPlatform.artist_id} with platform ID ${artistPlatform.platform_id}`
            );

            const response = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${artistPlatform.platform_id}&key=${Deno.env.get('YOUTUBE_API_KEY')}`,
              { method: 'GET' }
            );

            const data = await response.json();
            console.log('YouTube API response:', data);

            const subscriberCount = data.items?.[0]?.statistics?.subscriberCount;
            const viewCount = data.items?.[0]?.statistics?.viewCount;
            const timestamp = new Date().toISOString();
            console.log('Subscriber count:', subscriberCount);
            console.log('View count:', viewCount);

            // Get yesterday's view count
            const { data: yesterdayData, error: yesterdayError } = await supabase
              .from('artist_metrics')
              .select('value, date')
              .eq('artist_id', artistPlatform.artist_id)
              .eq('platform', 'youtube')
              .eq('metric_type', 'views')
              .lt('date', timestamp)
              .order('date', { ascending: false })
              .limit(1);

            if (yesterdayError) {
              console.error('Error fetching previous view count:', yesterdayError);
            }

            console.log('Previous view count data:', yesterdayData);

            // Calculate daily views if we have previous data
            let dailyViews = null;
            if (yesterdayData && yesterdayData.length > 0) {
              dailyViews = parseInt(viewCount) - parseInt(yesterdayData[0].value);
              console.log('Daily views calculation:', {
                currentViews: viewCount,
                previousViews: yesterdayData[0].value,
                difference: dailyViews
              });

              if (dailyViews >= 0) {
                const dailyResult = await supabase.from('artist_metrics').insert({
                  artist_id: artistPlatform.artist_id,
                  platform: 'youtube',
                  metric_type: 'daily_view_count',
                  value: dailyViews,
                  date: timestamp,
                });
                console.log('Daily view count insertion result:', dailyResult);

                if (dailyResult.error) {
                  console.error('Error inserting daily view count:', dailyResult.error);
                }

                console.log(`Daily views for ${artistPlatform.artist_id}: ${dailyViews} (Current: ${viewCount}, Previous: ${yesterdayData[0].value} from ${yesterdayData[0].date})`);
              } else {
                console.log(`Skipping negative daily views for ${artistPlatform.artist_id}: Current ${viewCount}, Previous ${yesterdayData[0].value} from ${yesterdayData[0].date}`);
              }
            } else {
              console.log(`No previous view count found for ${artistPlatform.artist_id}, skipping daily view calculation`);
            }

            // Store subscriber count
            if (subscriberCount) {
              const result = await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'youtube',
                metric_type: 'subscribers',
                value: parseInt(subscriberCount),
                date: timestamp,
              });
              console.log('Insert subscriber result:', result);
              youtubeCount++;
            } else {
              console.log('No subscriber count found for this channel');
            }

            // Store total views
            if (viewCount) {
              const result = await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'youtube',
                metric_type: 'views',
                value: viewCount,
                date: timestamp,
              });
              console.log('Total views insertion result:', result);
            } else {
              console.log('No view count found for this channel');
            }

            console.log(`YouTube metrics collected for artist ${artistPlatform.artist_id}:`, {
              subscribers: subscriberCount,
              total_views: viewCount,
              daily_views: dailyViews
            });
          }

          // Add Spotify metrics collection
          if (artistPlatform.platform === 'spotify' && spotifyAccessToken) {
            const response = await fetch(
              `https://api.spotify.com/v1/artists/${artistPlatform.platform_id}`,
              {
                method: 'GET',
                headers: {
                  Authorization: `Bearer ${spotifyAccessToken}`,
                },
              }
            );

            const data = await response.json();
            const followerCount = data.followers?.total;
            const popularity = data.popularity;
            const timestamp = new Date().toISOString();

            // Store follower count
            if (followerCount !== undefined) {
              await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'spotify',
                metric_type: 'followers',
                value: followerCount,
                date: timestamp,
              });
              spotifyCount++;
            }

            // Store popularity score
            if (popularity !== undefined) {
              await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'spotify',
                metric_type: 'popularity',
                value: popularity,
                date: timestamp,
              });
              // Don't increment spotifyCount here as it's the same artist
            }

            console.log(`Spotify metrics collected for artist ${artistPlatform.artist_id}:`, {
              followers: followerCount,
              popularity: popularity
            });
          }

          // Add Deezer metrics collection
          if (artistPlatform.platform === 'deezer') {
            console.log(
              `Fetching Deezer metrics for artist ${artistPlatform.artist_id} with platform ID ${artistPlatform.platform_id}`
            );

            const response = await fetch(
              `https://api.deezer.com/artist/${artistPlatform.platform_id}`,
              { method: 'GET' }
            );

            if (!response.ok) {
              console.error(`Deezer API error: ${response.status} ${response.statusText}`);
              continue;
            }

            const data = await response.json();
            console.log('Deezer API response:', data);

            const fanCount = data.nb_fan;
            const timestamp = new Date().toISOString();
            console.log('Fan count:', fanCount);

            // Store fan count
            if (typeof fanCount === 'number') {
              const result = await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'deezer',
                metric_type: 'followers',
                value: fanCount,
                date: timestamp,
              });
              console.log('Insert follower result:', result);
              deezerCount++;
            } else {
              console.log('No fan count found for this artist');
            }

            console.log(`Deezer metrics collected for artist ${artistPlatform.artist_id}:`, {
              followers: fanCount
            });
          }

          // Add Genius metrics collection
          if (artistPlatform.platform === 'genius') {
            console.log(
              `Fetching Genius metrics for artist ${artistPlatform.artist_id} with platform ID ${artistPlatform.platform_id}`
            );

            const geniusToken = Deno.env.get('GENIUS_ACCESS_TOKEN');
            if (!geniusToken) {
              console.error('Genius API token not available');
              continue;
            }

            // First, fetch the artist data to get followers
            const response = await fetch(
              `https://api.genius.com/artists/${artistPlatform.platform_id}`,
              {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${geniusToken}`
                }
              }
            );

            if (!response.ok) {
              console.error(`Genius API error: ${response.status} ${response.statusText}`);
              continue;
            }

            const data = await response.json();
            console.log('Genius API response:', data);

            const followerCount = data.response?.artist?.followers_count;
            const timestamp = new Date().toISOString();
            console.log('Genius follower count:', followerCount);

            // Store follower count
            if (typeof followerCount === 'number') {
              const result = await supabase.from('artist_metrics').insert({
                artist_id: artistPlatform.artist_id,
                platform: 'genius',
                metric_type: 'followers',
                value: followerCount,
                date: timestamp,
              });
              console.log('Insert Genius follower result:', result);
              geniusCount++;
            } else {
              console.log('No follower count found for this artist on Genius');
            }

            console.log(`Genius metrics collected for artist ${artistPlatform.artist_id}:`, {
              followers: followerCount
            });
          }
        } catch (platformError) {
          console.error(
            `Error processing artist ${artistPlatform.artist_id} platform ${artistPlatform.platform}:`,
            platformError
          );
          continue;
        }
      }
    }

    // At the end of your function, log the activity
    await supabase.from('activity_logs').insert({
      timestamp: new Date().toISOString(),
      type: 'success',
      message: 'Artist metrics collection completed',
      platform: 'system',
      details: `Processed ${artistPlatforms.length} artists (YouTube: ${youtubeCount}, Spotify: ${spotifyCount}, Deezer: ${deezerCount}, Genius: ${geniusCount})`,
    });

    // After logging the activity for successful collection
    await supabase.from('notifications').insert({
      title: 'Metrics Collection Complete',
      message: `Successfully collected metrics for ${artistPlatforms.length} artists (YouTube: ${youtubeCount}, Spotify: ${spotifyCount}, Deezer: ${deezerCount}, Genius: ${geniusCount})`,
      type: 'success',
      created_at: new Date().toISOString(),
    });

    console.log('Metrics collection completed successfully');
    return new Response('Metrics collected successfully', {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error collecting metrics:', error);

    // Log the error to activity_logs
    await supabase.from('activity_logs').insert({
      timestamp: new Date().toISOString(),
      type: 'error',
      message: 'Artist metrics collection failed',
      platform: 'system',
      details: error.message,
    });

    // For errors
    await supabase.from('notifications').insert({
      title: 'Metrics Collection Failed',
      message: `Error collecting metrics: ${error.message}`,
      type: 'error',
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ error: 'Failed to collect metrics' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
