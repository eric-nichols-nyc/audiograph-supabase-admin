import { unstable_cache, revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { chromium, Page } from 'playwright';

async function delay() {
  // Random delay between .45-1.25 minutes
  const delayTime = Math.random() * 5000 + 2000;
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
  artist_analytics: {
    spotify_monthly_listeners: number;
    [key: string]: number | undefined;
  };
  fromCache?: boolean;
  fetchedAt?: string;
}

// Add custom error class
class ScrapingError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
    this.name = 'ScrapingError';
  }
}

// Wrap the scraping logic in a cached function
const getViberateData = (artistName: string) => unstable_cache(
  async (): Promise<ViberateResponse> => {
    let browser = null;

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
          '--lang=en-US,en'
        ]
      });

      console.log('Starting fresh Viberate scrape for:', artistName);
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'en-US',
        deviceScaleFactor: 1,
        isMobile: false,
      });
      const page = await context.newPage();
      const encodedArtistName = encodeURIComponent(artistName.toLowerCase());
      console.log(encodedArtistName)
      const response = await page.goto(`https://www.viberate.com/artist/${encodedArtistName}`, { waitUntil: 'networkidle' });
      
      // Check if page loaded successfully
      if (!response?.ok()) {
        throw new ScrapingError(`Failed to load artist page: ${response?.statusText()}`, 404);
      }

      await page.waitForTimeout(3000);
      const socialStats = await page.evaluate(() => {
        // gets all the li elements in the class .header-stats   
          const socialStats = document.querySelectorAll('.header-socials li');
          return Array.from(socialStats).map(li => ({
            // select the fourth class of the li element
            platform: li.querySelector('div')?.className.split(' ')[3],
            followers: li.querySelector('strong')?.textContent
          }));
      });

      // Parse social stats into structured data
      const parsedStats: Record<string, number | undefined> = {
        facebook_followers: undefined,
        instagram_followers: undefined,
        youtube_subscribers: undefined,
        spotify_followers: undefined,
        tiktok_followers: undefined,
        soundcloud_followers: undefined
      };

      socialStats.forEach(stat => {
        if (!stat.platform || !stat.followers) return;
        
        // Map Viberate's class names to our platform names
        const platformMap: Record<string, keyof typeof parsedStats> = {
          'facebook': 'facebook_followers',
          'instagram': 'instagram_followers',
          'youtube': 'youtube_subscribers',
          'spotify': 'spotify_followers',
          'tiktok': 'tiktok_followers',
          'soundcloud': 'soundcloud_followers'
        };

        const platform = platformMap[stat.platform];
        if (platform) {
          parsedStats[platform] = parseFollowerCount(stat.followers);
        }
      });

      const spotify_monthly_listeners = await getMonthlyListeners(page);


      // Optionally, you can grab the result after submitting
      //console.log(content);
      await browser.close();

      return { 
        artist_analytics: {
          spotify_monthly_listeners: spotify_monthly_listeners || 0,
          ...parsedStats
        }, 
        fromCache: false,
        fetchedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Scraping error:', error);
      if (error instanceof ScrapingError) {
        throw error;
      }
      throw new ScrapingError('Failed to scrape data');
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
  [`viberate-data-${artistName}`],
  {
    revalidate: 86400,
    tags: [`viberate-data-${artistName}`],
  }
);

const getMonthlyListeners = async (page: Page): Promise<number> => {
  try {
    // Wait for 2 seconds before checking
    await page.waitForTimeout(2000);
    
    // First check if element exists to avoid the error
    const elementExists = await page.$('.analytics-module-content .stats strong');
    if (!elementExists) {
      console.log('Monthly listeners element not found on page');
      return 0;
    }

    const parseCompactNumber = (value: string | null | undefined): number | undefined => {
      if (!value) return undefined;
      const normalized = value.trim().toLowerCase();
      
      if (normalized.endsWith('k')) {
        return parseFloat(normalized.replace('k', '')) * 1000;
      }
      if (normalized.endsWith('m')) {
        return parseFloat(normalized.replace('m', '')) * 1000000;
      }
      if (normalized.endsWith('b')) {
        return parseFloat(normalized.replace('b', '')) * 1000000000;
      }
      
      return parseFloat(normalized);
    };

    const spotify_monthly_listeners = await page.$eval(
      '.analytics-module-content .stats strong', 
      (element:any) => element.textContent || null
    );
    return parseCompactNumber(spotify_monthly_listeners) || 0;
  } catch (error) {
    console.error('Error getting monthly listeners:', error);
    return 0;
  }
};

export const GET = async (req: Request) => {
  try {
    const {searchParams} = new URL(req.url);
    const artistName = searchParams.get('artistName');
    const clearCache = searchParams.get('clearCache') === 'true';

    if(!artistName) {
      return NextResponse.json(
        { error: 'Artist name is required' }, 
        { status: 400 }
      );
    }

    if (clearCache) {
      // console.log('Clearing cache for:', artistName);
      revalidateTag(`viberate-data-${artistName}`);
    }

    // Add cache debugging
    // console.log('Cache key:', `viberate-data-${artistName}`);
    
    const startTime = performance.now();
    const data = await getViberateData(artistName)();
    const endTime = performance.now();

    // More accurate cache detection (responses under 100ms are likely cached)
    const isCached = endTime - startTime < 100;
    
    // console.log(`Response time: ${endTime - startTime}ms`);
    // console.log(`Data for ${artistName} - ${isCached ? 'from cache' : 'freshly scraped'}`);
    
    // Check if we got valid data
    if (!data || (!data.artist_analytics)) {
      throw new ScrapingError('No data found for this artist', 404);
    }

    return NextResponse.json({
      ...data,
      fromCache: isCached,
      fetchedAt: isCached ? data.fetchedAt : new Date().toISOString(),
      responseTime: `${Math.round(endTime - startTime)}ms`,
      success: true
    });

  } catch (error) {
    // console.error('Route error:', error);
    
    if (error instanceof ScrapingError) {
      return NextResponse.json(
        { error: error.message }, 
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' }, 
      { status: 500 }
    );
  }
};
