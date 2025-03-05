import { unstable_cache, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

async function delay(customDelayMs?: number) {
  // If custom delay is provided, use it, otherwise use random delay
  const delayTime = customDelayMs || Math.random() * 5000 + 2000;
  await new Promise(resolve => setTimeout(resolve, delayTime));
}

// Helper function to parse follower counts
function parseFollowerCount(count: string | null | undefined): number | undefined {
  if (!count) return undefined;

  // Remove any non-numeric characters except K, M, B
  const normalized = count.replace(/[^0-9KMB.]/gi, '');

  // Convert to number
  let multiplier = 1;
  if (normalized.endsWith('K')) multiplier = 1000;
  if (normalized.endsWith('M')) multiplier = 1000000;
  if (normalized.endsWith('B')) multiplier = 1000000000;

  const number = parseFloat(normalized.replace(/[KMB]/gi, ''));
  return number * multiplier;
}

// Update the return type to include spotify_monthly_listeners
interface ViberateResponse {
  artist_analytics?: {
    spotify_monthly_listeners?: number;
    [key: string]: number | undefined;
  };
  pageSource?: string;
  fromCache?: boolean;
  fetchedAt?: string;
}

// Add custom error class
class ScrapingError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ScrapingError';
  }
}

// Bright Data CDP endpoint configuration
const AUTH = 'brd-customer-hl_0b974442-zone-scraping_browser1:sm74ogqec9yu';
const SBR_CDP = `wss://${AUTH}@brd.superproxy.io:9222`;

// Wrap the scraping logic in a cached function
const getViberateData = (artistName: string) =>
  unstable_cache(
    async (): Promise<ViberateResponse> => {
      let browser = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1} for ${artistName}`);

          // Connect to the CDP endpoint instead of launching a local browser
          console.log('Connecting to Bright Data Scraping Browser...');
          browser = await chromium.connectOverCDP(SBR_CDP);

          console.log('Starting fresh Viberate scrape for:', artistName);
          const context = await browser.newContext({
            // Add user agent to appear more like a real browser
            userAgent:
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            // Add viewport settings
            viewport: { width: 1280, height: 720 },
          });

          // Enable request/response logging for debugging
          context.on('request', request => console.log(`>> ${request.method()} ${request.url()}`));
          context.on('response', response =>
            console.log(`<< ${response.status()} ${response.url()}`)
          );

          const page = await context.newPage();

          // Add a small delay before navigation to ensure everything is ready
          await delay();

          const encodedArtistName = encodeURIComponent(artistName.toLowerCase());
          console.log('Encoded artist name:', encodedArtistName);

          // Try a simpler test URL first to verify proxy is working
          console.log('Testing proxy connection...');
          const testResponse = await page.goto('https://httpbin.org/ip', {
            timeout: 30000,
            waitUntil: 'networkidle',
          });

          if (testResponse?.ok()) {
            const ipContent = await page.content();
            console.log('Proxy test response:', ipContent);
          } else {
            console.log('Proxy test failed:', testResponse?.status());
          }

          // Now try the actual target URL
          console.log('Navigating to target URL...');
          const response = await page.goto(
            `https://en.wikipedia.org/wiki/Terry_Farrell_(actress)`,
            {
              timeout: 60000,
              waitUntil: 'networkidle',
            }
          );

          // Check if page loaded successfully
          if (!response?.ok()) {
            console.log(`Page load failed: ${response?.status()} ${response?.statusText()}`);
            throw new ScrapingError(
              `Failed to load page: ${response?.statusText() || 'Empty response'}`,
              404
            );
          }

          // Get the page content
          const pageSource = await page.content();
          console.log(`Page content length: ${pageSource.length} characters`);

          // Take a screenshot for debugging (optional)
          await page.screenshot({ path: `/tmp/viberate-${encodedArtistName}.png`, fullPage: true });
          console.log('Screenshot saved');

          // Extract social stats
          const socialStats = await page.evaluate(() => {
            // Gets all the li elements in the class .header-stats
            const socialStats = document.querySelectorAll('.header-socials li');
            return Array.from(socialStats).map(li => ({
              // Select the fourth class of the li element
              platform: li.querySelector('div')?.className.split(' ')[3],
              followers: li.querySelector('strong')?.textContent,
            }));
          });

          console.log('Extracted social stats:', socialStats);

          // Parse social stats into a structured format
          const artist_analytics = {};

          socialStats.forEach(stat => {
            if (stat.platform && stat.followers) {
              const followers = parseFollowerCount(stat.followers);
              if (followers) {
                if (stat.platform.includes('spotify')) {
                  artist_analytics['spotify_followers'] = followers;
                } else if (stat.platform.includes('instagram')) {
                  artist_analytics['instagram_followers'] = followers;
                } else if (stat.platform.includes('facebook')) {
                  artist_analytics['facebook_followers'] = followers;
                } else if (stat.platform.includes('youtube')) {
                  artist_analytics['youtube_subscribers'] = followers;
                } else if (stat.platform.includes('tiktok')) {
                  artist_analytics['tiktok_followers'] = followers;
                }
              }
            }
          });

          // Try to find Spotify monthly listeners
          try {
            const monthlyListeners = await page.evaluate(() => {
              const spotifyElement = document.querySelector('.header-meta-streams');
              return spotifyElement?.textContent?.trim();
            });

            if (monthlyListeners) {
              artist_analytics['spotify_monthly_listeners'] = parseFollowerCount(monthlyListeners);
            }
          } catch (err) {
            console.log('Error extracting monthly listeners:', err);
          }

          // Close browser properly
          await context.close();
          await browser.close();
          browser = null;

          // Return successful response
          return {
            artist_analytics,
            pageSource: pageSource,
            fromCache: false,
            fetchedAt: new Date().toISOString(),
          };
        } catch (error) {
          console.error(`Scraping error (attempt ${retryCount + 1}):`, error);
          retryCount++;

          // If we've reached max retries, throw the error
          if (retryCount >= maxRetries) {
            if (error instanceof ScrapingError) {
              throw error;
            }
            throw new ScrapingError(
              `Failed to scrape data after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }

          // Wait before retrying
          console.log(`Waiting before retry ${retryCount}...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * retryCount));
        } finally {
          // Ensure browser is closed
          if (browser) {
            try {
              await browser.close();
            } catch (closeError) {
              console.error('Error closing browser:', closeError);
            }
            browser = null;
          }
        }
      }

      // This should never be reached due to the throw in the catch block
      throw new ScrapingError('Failed to scrape data after all retries');
    },
    [`viberate-data-${artistName}`],
    {
      revalidate: 86400,
      tags: [`viberate-data-${artistName}`],
    }
  );

export const GET = async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const artistName = searchParams.get('artistName');
    const clearCache = searchParams.get('clearCache') === 'true';

    if (!artistName) {
      return NextResponse.json({ error: 'Artist name is required' }, { status: 400 });
    }

    if (clearCache) {
      console.log('Clearing cache for:', artistName);
      revalidateTag(`viberate-data-${artistName}`);
    }

    // Add cache debugging
    console.log('Cache key:', `viberate-data-${artistName}`);

    const startTime = performance.now();
    const data = await getViberateData(artistName)();
    const endTime = performance.now();

    // More accurate cache detection (responses under 100ms are likely cached)
    const isCached = endTime - startTime < 100;

    console.log(`Response time: ${endTime - startTime}ms`);
    console.log(`Data for ${artistName} - ${isCached ? 'from cache' : 'freshly scraped'}`);

    // Check if we got valid data
    if (!data) {
      throw new ScrapingError('No data found for this artist', 404);
    }

    return NextResponse.json({
      ...data,
      fromCache: isCached,
      fetchedAt: isCached ? data.fetchedAt : new Date().toISOString(),
      responseTime: `${Math.round(endTime - startTime)}ms`,
      success: true,
    });
  } catch (error) {
    console.error('Route error:', error);

    if (error instanceof ScrapingError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
};
