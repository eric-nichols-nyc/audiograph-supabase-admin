// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async req => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get all artists with Spotify IDs
    const { data: artists, error: artistsError } = await supabaseClient
      .from('artists')
      .select(
        `
        id, 
        name,
        artist_platform_ids!inner(platform, platform_id)
      `
      )
      .eq('artist_platform_ids.platform', 'spotify');

    if (artistsError) {
      throw artistsError;
    }

    console.log(`Found ${artists.length} artists with Spotify IDs`);

    // For each artist, scrape Spotify followers
    const API_TOKEN = Deno.env.get('BRIGHTDATA_API_KEY');

    if (!API_TOKEN) {
      throw new Error('BRIGHTDATA_API_KEY is not set');
    }

    const results = [];

    for (const artist of artists) {
      const spotifyId = artist.artist_platform_ids[0].platform_id;

      try {
        console.log(`Collecting Spotify followers for ${artist.name} (${spotifyId})`);

        const followerData = await scrapeWithBrightData(spotifyId);

        if (followerData && followerData.followers) {
          // Store the metrics in the database
          const { error: metricsError } = await supabaseClient.from('artist_metrics').insert({
            artist_id: artist.id,
            platform: 'spotify',
            metric_type: 'followers',
            value: followerData.followers,
            date: new Date().toISOString(),
          });

          if (metricsError) {
            console.error(`Error storing metrics for ${artist.name}:`, metricsError);
            continue;
          }

          results.push({
            artist: artist.name,
            followers: followerData.followers,
            success: true,
          });
        } else {
          results.push({
            artist: artist.name,
            success: false,
            error: 'No follower data returned',
          });
        }
      } catch (error) {
        console.error(`Error collecting followers for ${artist.name}:`, error);
        results.push({
          artist: artist.name,
          success: false,
          error: error.message,
        });
      }

      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Collected Spotify followers for ${results.filter(r => r.success).length} artists`,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in collecting Spotify followers:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to collect Spotify followers',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function scrapeWithBrightData(spotifyId: string) {
  try {
    const API_TOKEN = Deno.env.get('BRIGHTDATA_API_KEY');

    // Trigger the collector
    const triggerResponse = await fetch('https://api.brightdata.com/dca/trigger', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        collector: 'c_lkxnxnxnxnxnxn', // Replace with your actual collector ID for Spotify followers
        spotify_artist_id: spotifyId,
      }),
    });

    if (!triggerResponse.ok) {
      throw new Error(`Failed to trigger collector: ${triggerResponse.statusText}`);
    }

    const triggerData = await triggerResponse.json();
    const datasetId = triggerData.dataset_id;

    if (!datasetId) {
      throw new Error('No dataset ID returned from trigger');
    }

    console.log(`Collection started, dataset ID: ${datasetId}`);

    // Poll for results
    let results = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (!results && attempts < maxAttempts) {
      attempts++;

      // Wait before checking (starting with 3 seconds, increasing for each attempt)
      await new Promise(resolve => setTimeout(resolve, 3000 * attempts));

      const resultsResponse = await fetch(
        `https://api.brightdata.com/dca/dataset?id=${datasetId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${API_TOKEN}`,
          },
        }
      );

      if (!resultsResponse.ok) {
        throw new Error(`Failed to fetch results: ${resultsResponse.statusText}`);
      }

      const data = await resultsResponse.json();

      // Check if collection is complete and has data
      if (data.status === 'success' && data.count > 0) {
        results = data.results;
        console.log(`Collection complete, got ${data.count} results`);
        break;
      }

      console.log(`Attempt ${attempts}: Collection still in progress or no data yet...`);
    }

    if (!results) {
      throw new Error(`Failed to get results after ${maxAttempts} attempts`);
    }

    return results[0].data;
  } catch (error) {
    console.error('Error in scraping process:', error);
    throw error;
  }
}
