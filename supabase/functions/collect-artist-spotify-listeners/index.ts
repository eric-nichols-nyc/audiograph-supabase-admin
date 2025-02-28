// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

// Import Supabase Edge Function types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Redis } from 'https://deno.land/x/upstash_redis@v1.20.6/mod.ts'

// Define interfaces for our data structures
interface ArtistPlatform {
  artist_id: string;
  platform_id: string;
  platform: string;
}

interface SpotifyListenerResult {
  name: string;
  spotifyId: string | null;
  listeners: number;
}

// Add the scraping function
async function scrapeWithBrightData(artistName: string) {
  const API_TOKEN = Deno.env.get("BRIGHT_DATA_API_TOKEN");
  const COLLECTOR_ID = Deno.env.get("BRIGHT_DATA_COLLECTOR_ID");
  
  if (!API_TOKEN || !COLLECTOR_ID) {
    throw new Error("Missing Bright Data credentials");
  }
  
  try {
    // Trigger the collection
    const triggerResponse = await fetch(
      `https://api.brightdata.com/dca/trigger?collector=${COLLECTOR_ID}&queue_next=1`, 
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input: [{
            // Pass any parameters your collector needs
            artistName: artistName
          }],
          deliver: {
            type: "api_pull",
            flatten_csv: false,
            delivery_type: "deliver_results",
            filename: {}
          }
        })
      }
    );
    
    if (!triggerResponse.ok) {
      throw new Error(`Failed to trigger collector: ${triggerResponse.statusText}`);
    }
    
    const triggerData = await triggerResponse.json();
    const datasetId = triggerData.collection_id;
    
    if (!datasetId) {
      throw new Error("No dataset ID returned from trigger");
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
            'Authorization': `Bearer ${API_TOKEN}`
          }
        }
      );
      
      if (!resultsResponse.ok) {
        throw new Error(`Failed to fetch results: ${resultsResponse.statusText}`);
      }
      
      const data = await resultsResponse.json();
      
      // Check if collection is complete and has data
      if (data.status === "success" && data.count > 0) {
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
    console.error("Error in scraping process:", error);
    throw error;
  }
}

serve(async (req: Request) => {
  try {
    console.log('Spotify Listeners Collection - START');
    
    // Start the process in the background
    (async () => {
      try {
        // Check environment variables
        const envVars = {
          SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
          SUPABASE_SERVICE_ROLE_KEY: 'exists: ' + !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
          BRIGHT_DATA_API_TOKEN: 'exists: ' + !!Deno.env.get('BRIGHT_DATA_API_TOKEN'),
          BRIGHT_DATA_COLLECTOR_ID: 'exists: ' + !!Deno.env.get('BRIGHT_DATA_COLLECTOR_ID')
        }
        
        console.log('Environment variables check:', envVars);
        
        if (!envVars.SUPABASE_URL || !Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')) {
          throw new Error('Missing required Supabase environment variables');
        }

        // Check authorization
        const authHeader = req.headers.get('Authorization')
        console.log('Auth header:', authHeader ? 'present' : 'missing')

        if (!authHeader || !authHeader.includes('Bearer')) {
          throw new Error('Unauthorized: Missing or invalid auth header')
        }

        // Initialize Supabase client
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Get the request body if it contains Bright Data results
        const requestData = await req.json().catch(() => null);
        let brightDataResults: SpotifyListenerResult[] = [];
        
        if (requestData && Array.isArray(requestData) && requestData.length > 0 && requestData[0].data) {
          // Extract the Bright Data results from the request
          brightDataResults = requestData[0].data;
          console.log(`Received ${brightDataResults.length} artist listener records from request`);
        } else {
          console.log('No Bright Data results in request, will need to fetch artists from database');
        }

        // If no data was provided in the request, try to scrape it
        if (brightDataResults.length === 0) {
          try {
            // Note: This approach would require you to have a list of artist names
            // to scrape, which might not be practical
            const scrapedResults = await scrapeWithBrightData("popular artists");
            brightDataResults = scrapedResults;
          } catch (scrapeError) {
            console.error("Error scraping data:", scrapeError);
          }
        }

        // Fetch artists with Spotify IDs from the database
        const { data: artistPlatforms, error: artistError } = await supabase
          .from('artist_platform_ids')
          .select('artist_id, platform_id, platform')
          .eq('platform', 'spotify')
          .not('platform_id', 'is', null);
        
        if (artistError) {
          console.error('Error fetching artist platforms:', artistError);
          throw artistError;
        }

        console.log(`Found ${artistPlatforms?.length || 0} artists with Spotify IDs in database`);

        // Process each artist and update metrics
        let updatedCount = 0;
        const timestamp = new Date().toISOString();

        for (const artistPlatform of artistPlatforms || []) {
          // Find matching artist in Bright Data results
          const matchingResult = brightDataResults.find(
            result => result.spotifyId === artistPlatform.platform_id
          );

          if (matchingResult && matchingResult.listeners) {
            // Insert the metric into the database
            const { error: insertError } = await supabase
              .from('artist_metrics')
              .insert({
                artist_id: artistPlatform.artist_id,
                platform: 'spotify',
                metric_type: 'monthly_listeners',
                value: matchingResult.listeners,
                date: timestamp
              });

            if (insertError) {
              console.error(`Error inserting metric for artist ${artistPlatform.artist_id}:`, insertError);
              continue;
            }

            updatedCount++;
            console.log(`Updated monthly listeners for artist ${artistPlatform.artist_id}: ${matchingResult.listeners}`);
          } else {
            console.log(`No listener data found for artist ${artistPlatform.artist_id} with Spotify ID ${artistPlatform.platform_id}`);
          }
        }

        console.log(`Successfully updated ${updatedCount} artists with Spotify monthly listeners`);
        
        // After metrics collection is complete
        try {
          // Call the webhook to notify about job completion
          const webhookResponse = await fetch(
            'https://13da-2603-7000-9bf0-88a0-5dcf-2bf7-3b4a-8aba.ngrok-free.app/api/webhooks/metrics-complete',
            {
              method: 'POST',
              headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${Deno.env.get('WEBHOOK_SECRET') || ''}`,
              },
              body: JSON.stringify({
                type: 'spotify-listeners',
                status: 'completed',
                timestamp: new Date().toISOString(),
                artistsProcessed: updatedCount,
              }),
            }
          );
          
          if (!webhookResponse.ok) {
            console.error('Failed to call webhook:', await webhookResponse.text());
          } else {
            console.log('Webhook called successfully');
          }
        } catch (webhookError) {
          console.error('Error calling webhook:', webhookError);
        }

        // Log the secret (first few characters only for security)
        const secret = Deno.env.get('WEBHOOK_SECRET') || '';
        console.log('Webhook secret available:', secret ? 'Yes (first 4 chars: ' + secret.substring(0, 4) + ')' : 'No');

        return new Response(JSON.stringify({
          success: true,
          message: `Updated ${updatedCount} artists with Spotify monthly listeners`
        }), { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Error in background process:', error);
      }
    })();
    
    // Return immediately
    return new Response(JSON.stringify({
      success: true,
      message: 'Spotify listeners collection started'
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error starting Spotify listeners collection:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: 'Failed to start Spotify listeners collection' 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
