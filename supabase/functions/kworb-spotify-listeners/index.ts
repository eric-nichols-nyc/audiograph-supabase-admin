// Follow this setup guide to integrate the Deno runtime into your Supabase project:
// https://github.com/supabase/supabase/tree/master/examples/edge-functions/supabase/functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import * as playwright from 'https://esm.sh/playwright@1.32.1';

// Define the interface for the scraped data
interface SpotifyListenerData {
  artist: string;
  spotify_id: string;
  listeners: number;
  dailyTrend: number;
  peak: number;
  peakListeners: number;
}

// Create a Supabase client for the edge function
const createEdgeClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

serve(async (req) => {
  try {
    console.log('Starting Kworb Spotify listeners scraping...');
    
    // Step 1: Scrape data from Kworb
    const scrapedData = await scrapeKworbSpotifyListeners();
    console.log(`Scraped ${scrapedData.length} artists from Kworb`);

    // Step 2: Initialize Supabase client for edge function
    console.log('Initializing Supabase edge client...');
    const supabase = createEdgeClient();

    // Step 3: Get all artists with their Spotify platform IDs
    console.log('Fetching artists and platform IDs from database...');
    const { data: artists, error: artistsError } = await supabase.from('artists').select(`
        id,
        name,
        artist_platform_ids (
          platform,
          platform_id
        )
      `);

    if (artistsError) {
      console.error('Error fetching artists:', artistsError);
      throw artistsError;
    }

    console.log(`Fetched ${artists.length} artists from database`);

    // Step 4: Create a map of Spotify IDs to artist IDs for easier lookup
    const spotifyIdToArtistMap = new Map();

    artists.forEach((artist: any) => {
      if (artist.artist_platform_ids && Array.isArray(artist.artist_platform_ids)) {
        artist.artist_platform_ids.forEach((platformId: any) => {
          if (platformId.platform === 'spotify' && platformId.platform_id) {
            spotifyIdToArtistMap.set(platformId.platform_id, artist.id);
          }
        });
      }
    });

    console.log(`Created map with ${spotifyIdToArtistMap.size} Spotify IDs`);

    // Step 5: Match scraped data with artists and prepare metrics
    console.log('Matching scraped data with artists...');
    const metricsToUpdate = [];
    let matchCount = 0;

    scrapedData.forEach((item: SpotifyListenerData) => {
      if (item.spotify_id && spotifyIdToArtistMap.has(item.spotify_id)) {
        const artistId = spotifyIdToArtistMap.get(item.spotify_id);

        // Create monthly listeners metric only
        metricsToUpdate.push({
          artist_id: artistId,
          platform: 'spotify',
          metric_type: 'monthly_listeners',
          value: item.listeners,
        });

        matchCount++;
      }
    });

    console.log(`Found ${matchCount} matching artists out of ${scrapedData.length} scraped`);

    if (matchCount === 0) {
      console.warn('No matches found between scraped data and database artists');
    }

    // Step 6: Insert a new artist_metrics record for each matched metric
    console.log('Inserting new records to track metrics over time...');

    let insertedCount = 0;

    for (const metric of metricsToUpdate) {
      const timestamp = new Date().toISOString();

      // Always insert a new row, ignoring any existing entries
      const { error: insertError } = await supabase.from('artist_metrics').insert({
        date: timestamp,
        artist_id: metric.artist_id,
        platform: metric.platform,
        metric_type: metric.metric_type,
        value: metric.value,
      });

      if (insertError) {
        console.error('Error inserting metric:', insertError);
        continue;
      }

      insertedCount++;
    }

    console.log(`Database insert complete. Inserted ${insertedCount} records.`);

    // Return response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Completed individual metric inserts.',
        total_scraped: scrapedData.length,
        matches_found: matchCount,
        metrics_inserted: insertedCount,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error during scraping or data update:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Scraping function using Bright Data browser and Playwright
async function scrapeKworbSpotifyListeners(maxRetries = 3): Promise<SpotifyListenerData[]> {
  const URL = 'https://kworb.net/spotify/listeners.html';
  const browserWs = Deno.env.get('BROWSER_WS') || 
    'wss://brd-customer-hl_0b974442-zone-scraping_browser1:sm74ogqec9yu@brd.superproxy.io:9222';

  let attempt = 0;
  while (attempt < maxRetries) {
    attempt++;
    console.log(`Scraping attempt #${attempt} of ${maxRetries}...`);

    let browser;
    try {
      console.log('Connecting to browser...');
      browser = await playwright.chromium.connectOverCDP(browserWs);

      console.log('Opening page...');
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('Page loaded successfully');

      // Parse the table data
      return await extractTableData(page);
    } catch (error) {
      console.error(`Scraping attempt #${attempt} failed:`, error);

      // If we've reached the max retries, throw the error
      if (attempt >= maxRetries) {
        throw error;
      }

      // Otherwise, wait 2 seconds and try again
      console.log('Retrying in 2 seconds...');
      await new Promise(res => setTimeout(res, 2000));
    } finally {
      // Ensure the browser closes even if an error occurs
      if (browser) {
        await browser.close();
      }
    }
  }

  // Fallback if somehow we exit the loop unexpectedly
  throw new Error(`Failed to scrape after ${maxRetries} attempts.`);
}

async function extractTableData(page: any): Promise<SpotifyListenerData[]> {
  return await page.evaluate(() => {
    const rows = document.querySelectorAll('.addpos.sortable tbody tr');

    return Array.from(rows)
      .slice(0, 100)
      .map((row: any) => {
        const cells = row.querySelectorAll('td');

        // Get artist name and URL
        const artistElement = cells[0].querySelector('a');
        const artistName = artistElement ? artistElement.textContent || '' : '';
        const artistUrl = artistElement ? artistElement.getAttribute('href') || '' : '';

        // Extract Spotify ID from the URL
        // URL format: artist/0du5cEVh5yTK9QJze8zA0C_songs.html
        let spotifyId = '';
        if (artistUrl) {
          const match = artistUrl.match(/artist\/([^_]+)_songs\.html/);
          if (match && match[1]) {
            spotifyId = match[1];
          }
        }

        // Format numbers by removing commas
        const formatNumber = (text: string) => {
          return parseInt(text.replace(/,/g, '')) || 0;
        };

        return {
          artist: artistName,
          spotify_id: spotifyId,
          listeners: formatNumber(cells[1] ? cells[1].textContent || '0' : '0'),
          dailyTrend: parseInt((cells[2] ? cells[2].textContent || '0' : '0').replace(/,/g, '')),
          peak: parseInt(cells[3] ? cells[3].textContent || '0' : '0'),
          peakListeners: formatNumber(cells[4] ? cells[4].textContent || '0' : '0'),
        };
      });
  });
}