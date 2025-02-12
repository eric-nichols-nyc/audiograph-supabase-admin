import { chromium } from 'playwright';

export const unstable_cache = 'force-cache';

export async function GET(request: Request) {
  // Retrieve the artist from the query string
  const { searchParams } = new URL(request.url);
  const artistSpotifyId = searchParams.get('artistSpotifyId');
  if (!artistSpotifyId) {
    return new Response(
      JSON.stringify({
        message:
          'Artist Spotify ID parameter missing. Please provide an artist Spotify ID parameter like ?artistSpotifyId=1dfeR4HaWDbWqFHLkxsg1d',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let browser;
  try {
    // Launch a Chromium instance using Playwright
    browser = await chromium.launch();
    const page = await browser.newPage();

    // Navigate to the Spotify tracks page on kworb.net using the provided artist parameter
    await page.goto(`https://kworb.net/spotify/artist/${artistSpotifyId}_songs.html`);

    // Extract track data from the tracks table
    const tracks = await page.$$eval('table.addpos.sortable tbody tr', rows => {
      return Array.from(rows)
        .map(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 3) return null; // Expecting three columns: Title, Streams, Daily
          const titleCell = cells[0];
          const link = titleCell.querySelector('a');
          if (!link) return null;
          
          const href = link.getAttribute('href') || '';
          // Extract the Spotify track ID from the URL
          const trackIdMatch = href.match(/\/track\/([^/?]+)/);
          const trackId = trackIdMatch ? trackIdMatch[1] : '';
          
          const title = link.textContent.trim();
          // Determine if the track is a collaboration based on asterisk prefix in the text of the first cell
          const isCollaboration = titleCell.textContent.trim().startsWith('*');
          
          const streamsText = cells[1].textContent.trim();
          const dailyText = cells[2].textContent.trim();
          const streams = parseInt(streamsText.replace(/,/g, ''), 10);
          const dailyStreams = parseInt(dailyText.replace(/,/g, ''), 10);

          return { title, trackId, streams, dailyStreams, isCollaboration };
        })
        .filter(item => item !== null)
        .slice(0, 50);
    });

    return new Response(JSON.stringify({ tracks }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: 'Scraping failed',
        error: error instanceof Error ? error.toString() : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (browser) await browser.close();
  }
}