// app/api/spotify-listeners/route.ts
import { chromium } from 'playwright';
import { NextRequest, NextResponse } from 'next/server';
import { brightDataService } from '@/services/bright-data.service';
import { createServiceClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Step 1: Scrape data from Kworb
    console.log('Starting Kworb Spotify listeners scraping...');
    const scrapedData = await brightDataService.scrapeKworbSpotifyListeners();
    console.log(`Scraped ${scrapedData.length} artists from Kworb`);

    // Log a few sample records to verify data
    if (scrapedData.length > 0) {
      console.log('kworb route: Sample scraped data:', scrapedData.slice(0, 3));
    }

    // Step 2: Get Supabase client (using service client for API routes)
    console.log('Initializing Supabase service client...');
    const supabase = createServiceClient();

    // Verify Supabase connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('artists')
      .select('count')
      .limit(1);
    if (healthError) {
      console.error('Supabase connection error:', healthError);
      throw new Error(`Supabase connection failed: ${healthError.message}`);
    }
    console.log('Supabase connection successful');

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

    artists.forEach(artist => {
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

    scrapedData.forEach(item => {
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
      // Log some Spotify IDs from both sides to help diagnose
      const scrapedIds = scrapedData.slice(0, 10).map(item => item.spotify_id);
      console.log('Sample scraped Spotify IDs:', scrapedIds);
      console.log(
        'Sample database Spotify IDs:',
        Array.from(spotifyIdToArtistMap.keys()).slice(0, 10)
      );
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
    return NextResponse.json({
      success: true,
      message: 'Completed individual metric inserts.',
      total_scraped: scrapedData.length,
      matches_found: matchCount,
      metrics_inserted: insertedCount,
      data: scrapedData,
    });
  } catch (error: any) {
    console.error('Error during scraping or data update:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}

async function extractTableData(page: any) {
  return await page.evaluate(() => {
    const rows = document.querySelectorAll('.addpos.sortable tbody tr');

    return Array.from(rows).map(row => {
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
