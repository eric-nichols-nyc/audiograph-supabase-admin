import { unstable_cache } from "next/cache";
import { chromium } from "playwright";

export interface YouTubeChartsArtistIdResponse {
  success: boolean;
  artistId?: string;
  encodedArtistId?: string;
  url?: string;
  error?: string;
  fromCache?: boolean;
  fetchedAt?: string;
}

const delay = async () => {
  const delayTime = Math.random() * 2000 + 1000; // Delay between 1s and 2s
  await new Promise(resolve => setTimeout(resolve, delayTime));
};

/**
 * Extracts the YouTube Charts artist ID for a given artist name
 * 
 * @param artistName The name of the artist to search for
 * @returns A response object containing the artist ID and related information
 */
export const getYoutubeChartsArtistId = async (artistName: string): Promise<YouTubeChartsArtistIdResponse> =>
  await unstable_cache(
    async (): Promise<YouTubeChartsArtistIdResponse> => {
      let browser: any = null;

      try {
        await delay();
        browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--lang=en-US,en',
            '--disable-blink-features=AutomationControlled'
          ]
        });

        console.log('Starting fresh YouTube Charts scrape for:', artistName);
        const context = await browser.newContext({
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          locale: 'en-US',
          deviceScaleFactor: 1,
          isMobile: false,
          extraHTTPHeaders: {
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8'
          }
        });

        const page = await context.newPage();
        
        page.on('console', msg => console.log(`Browser console: ${msg.text()}`));
        
        const takeScreenshot = process.env.NODE_ENV === 'development';
        
        console.log('Navigating to YouTube Charts...');
        await page.goto('https://charts.youtube.com/', { 
          waitUntil: 'networkidle',
          timeout: 30000
        });
        
          await page.screenshot({ path: '/tmp/youtube-charts-homepage.png' });
        
        await page.waitForTimeout(3000);
        
        console.log('Looking for search input...');
        const searchInputSelector = [
          '#search-native',
          'input[type="search"]',
          '[placeholder*="Search"]',
          '[aria-label*="Search"]'
        ];
        
        let searchInput = null;
        for (const selector of searchInputSelector) {
          searchInput = await page.$(selector);
          if (searchInput) {
            console.log(`Found search input with selector: ${selector}`);
            break;
          }
        }
        
        if (!searchInput) {
          if (takeScreenshot) {
            await page.screenshot({ path: '/tmp/search-input-not-found.png' });
          }
          throw new Error('Search input not found');
        }

        console.log(`Searching for artist: ${artistName}`);
   
          await searchInput.click();
          await page.keyboard.type(artistName, { delay: 100 });
          await page.keyboard.press('Enter');
      
        
        await page.waitForNavigation({ 
          waitUntil: 'networkidle', 
          timeout: 15000 
        }).catch(() => {
          console.log('Navigation timeout, checking URL anyway');
        });
        
        await page.waitForTimeout(3000);
        
        if (takeScreenshot) {
          await page.screenshot({ path: '/tmp/search-results.png' });
        }

        // Get the current URL
        const currentUrl = page.url();
        
        // Extract artist ID from URL
        const urlObj = new URL(currentUrl);
        const path = urlObj.pathname;
        console.log('Current URL:', currentUrl);
        
        // Extract the artist ID
        const artistIdMatch = path.match(/\/artist\/([^\/]+)$/);
        
        if (!artistIdMatch) {
          throw new Error('Artist ID not found in URL');
        }
        
        // Decode the URL-encoded ID
        const encodedArtistId = artistIdMatch[1];
        const decodedArtistId = decodeURIComponent(encodedArtistId);

        await browser.close();

        return {
          success: true,
          artistId: decodedArtistId,
          encodedArtistId: encodedArtistId,
          url: currentUrl,
          fromCache: false,
          fetchedAt: new Date().toISOString()
        };

      } catch (error) {
        console.error('Error scraping YouTube Charts:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
          fromCache: false,
          fetchedAt: new Date().toISOString()
        };
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    },
    [`youtube-charts-artist-id-${artistName}`],
    {
      revalidate: 604800, // Cache for 1 week (in seconds)
      tags: [`youtube-charts-artist-id-${artistName}`],
    }
  )();

/**
 * Fetches YouTube Charts data for an artist using their artist ID
 * This is a placeholder function that can be expanded to fetch more data
 * 
 * @param artistId The YouTube Charts artist ID
 * @returns A response object containing the artist's YouTube Charts data
 */
export const getYoutubeChartsData = async (artistId: string) => {
  // This function can be implemented to fetch additional data
  // from YouTube Charts using the artist ID
  
  // For now, it just returns a basic structure
  return {
    success: true,
    artistId,
    url: `https://charts.youtube.com/artist/${encodeURIComponent(artistId)}`,
    fromCache: false,
    fetchedAt: new Date().toISOString()
  };
}; 