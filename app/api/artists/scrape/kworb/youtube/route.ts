import { chromium } from 'playwright';

export const unstable_cache = 'force-cache';

export async function GET(request: Request) {
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

    // Navigate to the artist page on kworb.net using the provided artist parameter
    await page.goto(`https://kworb.net/youtube/artist/${artist}.html`);

    // Extract video data from the table
    const videos = await page.$$eval('table.addpos.sortable tbody tr', rows => {
      return Array.from(rows).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 4) return null;
        const videoCell = cells[0];
        const link = videoCell.querySelector('a');
        if (!link) return null;
        const href = link.getAttribute('href') || '';
        const videoId = href.replace(/^\.\.\/video\//, '').replace(/\.html$/, '');
        const title = link.textContent.trim();
        const isCollaboration = videoCell.textContent.trim().startsWith('*');
        const viewsText = cells[1].textContent.trim();
        const dailyViewsText = cells[2].textContent.trim();
        const publishedStr = cells[3].textContent.trim();
        const publishedDate = new Date(publishedStr + '/01').toISOString();
        const views = parseInt(viewsText.replace(/,/g, ''), 10);
        const dailyViews = parseInt(dailyViewsText.replace(/,/g, ''), 10);
        return { title, videoId, views, dailyViews, publishedDate, isCollaboration };
      }).filter(item => item !== null).slice(0, 50);
    });

    return new Response(JSON.stringify({ videos }), {
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
