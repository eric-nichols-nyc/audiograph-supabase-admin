import { chromium } from 'playwright';

export const unstable_cache = 'force-cache';

export async function GET(request: Request) {
  // Retrieve the artist from the query string
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  if (!artist) {
    return new Response(
      JSON.stringify({
        message: 'Artist parameter missing. Please provide an artist parameter like ?artist=justinbieber',
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
    await page.goto(`https://kworb.net/spotify/artist/${artist}_songs.html`);

    // Extract information from the third .subcontainer.
    // The first table inside it contains the artist stats and the second table (with class "addpos sortable") contains the tracks.
    const result = await page.evaluate(() => {
      const subcontainers = document.querySelectorAll('.subcontainer');
      if (subcontainers.length < 5) return { stats: [], tracks: [] };
      const container = subcontainers[4];
      const tables = container.getElementsByTagName('table');
      // Assume first table is stats; second table (with class "addpos sortable") is tracks.
      const statsTable = tables[0];
      const tracksTable = tables[1];

      // Parse artist stats table
      const stats = Array.from(statsTable.querySelectorAll('tbody tr')).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 5) return null;

        // Add null checks for each cell
        const label = cells[0]?.textContent?.trim() || '';
        const totalText = cells[1]?.textContent?.replace(/,/g, '') || '0';
        const asLeadText = cells[2]?.textContent?.replace(/,/g, '') || '0';
        const soloText = cells[3]?.textContent?.replace(/,/g, '') || '0';
        const asFeatureText = cells[4]?.textContent?.replace(/,/g, '') || '0';

        const total = parseInt(totalText, 10);
        const asLead = parseInt(asLeadText, 10);
        const solo = parseInt(soloText, 10);
        const asFeature = parseInt(asFeatureText, 10);

        return { label, total, asLead, solo, asFeature };
      }).filter(item => item !== null);

      // Parse tracks table
      const tracks = Array.from(tracksTable.querySelectorAll('tbody tr')).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 3) return null;

        const titleCell = cells[0];
        const link = titleCell.querySelector('a');
        if (!link) return null;

        const href = link.getAttribute('href') || '';
        const trackIdMatch = href.match(/\/track\/([^/?]+)/);
        const trackId = trackIdMatch ? trackIdMatch[1] : '';

        // Add null checks for text content
        const title = link.textContent?.trim() || '';
        const titleCellText = titleCell.textContent?.trim() || '';
        const isCollaboration = titleCellText.startsWith('*');

        const streamsText = cells[1]?.textContent?.trim() || '0';
        const dailyText = cells[2]?.textContent?.trim() || '0';

        const streams = parseInt(streamsText.replace(/,/g, ''), 10);
        const dailyStreams = parseInt(dailyText.replace(/,/g, ''), 10);

        return { title, trackId, streams, dailyStreams, isCollaboration };
      }).filter(item => item !== null).slice(0, 25);

      return { stats, tracks };
    });

    return new Response(JSON.stringify(result), {
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
