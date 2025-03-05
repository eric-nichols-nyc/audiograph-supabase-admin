import { chromium } from 'playwright';

export interface SpotifyListenerData {
  artist: string;
  spotify_id: string;
  listeners: number;
  dailyTrend: number;
  peak: number;
  peakListeners: number;
}

export class BrightDataService {
  private readonly browserWs: string;

  constructor() {
    this.browserWs =
      process.env.BROWSER_WS ||
      'wss://brd-customer-hl_0b974442-zone-scraping_browser1:sm74ogqec9yu@brd.superproxy.io:9222';
  }

  async scrapeKworbSpotifyListeners(): Promise<SpotifyListenerData[]> {
    const URL = 'https://kworb.net/spotify/listeners.html';
    console.log('Connecting to browser...');

    const browser = await chromium.connectOverCDP(this.browserWs);

    try {
      console.log('Opening page...');
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
      console.log('Page loaded successfully');

      // Parse the table data
      return await this.extractTableData(page);
    } catch (error) {
      console.error('Error during scraping:', error);
      throw error;
    } finally {
      await browser.close();
    }
  }

  private async extractTableData(page: any): Promise<SpotifyListenerData[]> {
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
}

export const brightDataService = new BrightDataService();
