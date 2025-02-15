import { chromium } from 'playwright';

/**
 * Internal function that performs the actual scraping logic.
 */
const _scrapeKworbData = async (
  artistName: string,
  type: 'tracks' | 'videos'
): Promise<any> => {
  let browser;
  try {
    browser = await chromium.launch();
    const page = await browser.newPage();
    let url = '';
    if (type === 'tracks') {
      url = `https://kworb.net/spotify/artist/${artistName}_songs.html`;
    } else if (type === 'videos') {
      url = `https://kworb.net/youtube/artist/${artistName}.html`;
    } else {
      throw new Error(`Invalid scrape type: ${type}`);
    }

    await page.goto(url);

    if (type === 'tracks') {
      // Scrape tracks
      const result = await page.evaluate(() => {
        const subcontainers = document.querySelectorAll('.subcontainer');
        console.log('Found subcontainers:', subcontainers, subcontainers.length);
        if (subcontainers.length < 5) {
          console.log('Not enough subcontainers. Expected at least 5.');
          return { stats: [], tracks: [] };
        }
        const container = subcontainers[4];
        const tables = container.getElementsByTagName('table');

        // First table is stats; second table (with class "addpos sortable") is tracks.
        const statsTable = tables[0];
        const tracksTable = tables[1];

        // Parse artist stats table
        const stats = Array.from(statsTable.querySelectorAll('tbody tr')).map(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length < 5) return null;
          const label = cells[0].textContent?.trim() || "";
          const total = parseInt(cells[1].textContent?.replace(/,/g, '') || '0', 10);
          const asLead = parseInt(cells[2].textContent?.replace(/,/g, '') || '0', 10);
          const solo = parseInt(cells[3].textContent?.replace(/,/g, '') || '0', 10);
          const asFeature = parseInt(cells[4].textContent?.replace(/,/g, '') || '0', 10);
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
          const title = link.textContent?.trim() || "";
          const isCollaboration = (titleCell.textContent?.trim() || "").startsWith('*');
          const streamsText = cells[1].textContent?.trim() || "";
          const dailyText = cells[2].textContent?.trim() || "";
          const streams = parseInt(streamsText.replace(/,/g, '') || '0', 10);
          const dailyStreams = parseInt(dailyText.replace(/,/g, '') || '0', 10);
          return { title, trackId, streams, dailyStreams, isCollaboration };
        }).filter(item => item !== null).slice(0, 25);

        return { stats, tracks };
      });
      return result;
    } else if (type === 'videos') {
      // Scrape videos
      const videos = await page.$$eval('table.addpos.sortable tbody tr', rows => {
        return Array.from(rows)
          .map(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 4) return null;
            const videoCell = cells[0];
            const link = videoCell.querySelector('a');
            if (!link) return null;
            const href = link.getAttribute('href') || '';
            // Remove the "../video/" prefix and ".html" suffix to get the video ID.
            const videoId = href.replace(/^\.\.\/video\//, '').replace(/\.html$/, '');
            const title = link.textContent?.trim() || "";
            const isCollaboration = (videoCell.textContent?.trim() || "").startsWith('*');
            const viewsText = cells[1].textContent?.trim() || "";
            const dailyViewsText = cells[2].textContent?.trim() || "";
            const publishedStr = cells[3].textContent?.trim() || "";
            const publishedDate = new Date(publishedStr + '/01').toISOString();
            const views = parseInt(viewsText.replace(/,/g, '') || '0', 10);
            const dailyViews = parseInt(dailyViewsText.replace(/,/g, '') || '0', 10);
            return { title, videoId, views, dailyViews, publishedDate, isCollaboration };
          })
          .filter(item => item !== null)
          .slice(0, 50);
      });
      return { videos };
    } else {
      throw new Error(`Invalid scrape type: ${type}`);
    }
  } catch (error) {
    throw new Error(`Scraping failed: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (browser) await browser.close();
  }
};

export const scrapeKworbData = async (
  artistName: string,
  type: 'tracks' | 'videos'
): Promise<any> => {
  return await _scrapeKworbData(artistName, type);
};

export const getKworbData = async (artistName: string) => {
  const url = `https://kworb.net/youtube/artist/${artistName}.html`;
  const response = await fetch(url);
  const data = await response.json();
  return data;
}; 