// services/viberateService.ts
import { unstable_cache } from "next/cache";
import { chromium, Page } from "playwright";
import { ArtistMetric } from "@/types/artists";

export interface ViberateResponse {
  artist_analytics: {
    spotify_monthly_listeners: number;
    facebook_followers?: number;
    instagram_followers?: number;
    youtube_subscribers?: number;
    spotify_followers?: number;
    tiktok_followers?: number;
    soundcloud_followers?: number;
    total_views?: number;
    total_streams?: number;
  };
  fromCache?: boolean;
  fetchedAt?: string;
}

const delay = async () => {
  const delayTime = Math.random() * 5000 + 2000; // Delay between 2s and 7s
  await new Promise(resolve => setTimeout(resolve, delayTime));
};

const parseFollowerCount = (count: string | null | undefined): number | undefined => {
  if (!count) return undefined;
  // Remove all characters except numeric digits, K, M, B, or dot.
  const normalized = count.replace(/[^0-9KMB.]/gi, '');
  let multiplier = 1;
  if (normalized.endsWith('K')) multiplier = 1000;
  if (normalized.endsWith('M')) multiplier = 1000000;
  if (normalized.endsWith('B')) multiplier = 1000000000;
  const num = parseFloat(normalized.replace(/[KMB]/gi, ''));
  return num * multiplier;
};

const getMonthlyListeners = async (page: Page): Promise<number> => {
  try {
    await page.waitForTimeout(2000);
    const elementExists = await page.$('.analytics-module-content .stats strong');
    if (!elementExists) {
      console.log('Monthly listeners element not found on page');
      return 0;
    }
    const listenersText = await page.$eval(
      '.analytics-module-content .stats strong',
      (element: HTMLElement) => element.innerText || null
    );
    return parseFollowerCount(listenersText) || 0;
  } catch (error) {
    console.error("Error getting monthly listeners:", error);
    return 0;
  }
};

export const getViberateData = async (artistName: string): Promise<ViberateResponse> =>
  await unstable_cache(
    async (): Promise<ViberateResponse> => {
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
            '--lang=en-US,en'
          ]
        });
        console.log('Starting fresh Viberate scrape for:', artistName);
        const context = await browser.newContext({
          userAgent:
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1920, height: 1080 },
          locale: 'en-US',
          deviceScaleFactor: 1,
          isMobile: false,
        });
        const page = await context.newPage();
        const encodedArtistName = encodeURIComponent(artistName.toLowerCase());
        const response = await page.goto(`https://www.viberate.com/artist/${encodedArtistName}`, { waitUntil: 'networkidle' });
        if (!response?.ok()) {
          throw new Error(`Failed to load artist page: ${response?.statusText()}`);
        }
        await page.waitForTimeout(3000);

        // Scrape social stats from the header-socials list
        const socialStats = await page.evaluate(() => {
          const stats = document.querySelectorAll('.header-socials li');
          return Array.from(stats).map(li => ({
            // Assume the fourth class includes the platform (e.g., "facebook")
            platform: li.querySelector('div')?.className.split(' ')[3],
            followers: li.querySelector('strong')?.textContent,
          }));
        });

        const parsedStats: Record<string, number | undefined> = {
          facebook_followers: undefined,
          instagram_followers: undefined,
          youtube_subscribers: undefined,
          spotify_followers: undefined,
          tiktok_followers: undefined,
          soundcloud_followers: undefined,
        };

        socialStats.forEach((stat: any) => {
          if (!stat.platform || !stat.followers) return;
          const platformMap: Record<string, keyof typeof parsedStats> = {
            facebook: 'facebook_followers',
            instagram: 'instagram_followers',
            youtube: 'youtube_subscribers',
            spotify: 'spotify_followers',
            tiktok: 'tiktok_followers',
            soundcloud: 'soundcloud_followers'
          };
          const platform = platformMap[stat.platform];
          if (platform) {
            parsedStats[platform] = parseFollowerCount(stat.followers);
          }
        });

        // Retrieve monthly listeners from the analytics section
        const spotify_monthly_listeners = await getMonthlyListeners(page);
        await browser.close();

        return {
          artist_analytics: {
            spotify_monthly_listeners: Math.round(spotify_monthly_listeners) || 0,
            ...parsedStats,
          },
          fromCache: false,
          fetchedAt: new Date().toISOString(),
        };
      } catch (error) {
        console.error('Scraping error in Viberate service:', error);
        throw new Error('Failed to scrape data from Viberate');
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
  )();


// Define a mapping between ViberateResponse fields and platform/metric details.
const analyticsMapping: {
  [key in keyof ViberateResponse["artist_analytics"]]: {
    platform: string;
    metric_type: ArtistMetric["metric_type"];
  };
} = {
  spotify_monthly_listeners: {
    platform: "spotify",
    metric_type: "monthly_listeners",
  },
  facebook_followers: {
    platform: "facebook",
    metric_type: "followers",
  },
  instagram_followers: {
    platform: "instagram",
    metric_type: "followers",
  },
  youtube_subscribers: {
    platform: "youtube",
    metric_type: "subscribers",
  },
  spotify_followers: {
    platform: "spotify",
    metric_type: "followers",
  },
  tiktok_followers: {
    platform: "tiktok",
    metric_type: "followers",
  },
  soundcloud_followers: {
    platform: "soundcloud",
    metric_type: "followers",
  },
  total_views: {
    platform: "youtube",
    metric_type: "total_views",
  },
  total_streams: {
    platform: "spotify",
    metric_type: "total_streams",
  },
};

/**
 * Converts a ViberateResponse object to an array of ArtistMetric entries.
 *
 * @param artistId The id of the artist to be associated with the metrics.
 * @param response The raw analytics data from Viberate.
 * @returns An array of ArtistMetric objects formatted for the database.
 */
export function convertViberateResponseToArtistMetrics(
  response: ViberateResponse
): Omit<ArtistMetric, 'id' | 'date'>[] {
  const metrics: Omit<ArtistMetric, 'id' | 'date'>[] = [];

  // Loop through each analytics field in the response.
  for (const key in response.artist_analytics) {
    if (response.artist_analytics.hasOwnProperty(key)) {
      const value = response.artist_analytics[key as keyof ViberateResponse["artist_analytics"]];
      if (value === undefined || typeof value !== "number") continue; // Skip undefined or invalid values

      const mappingInfo = analyticsMapping[key as keyof typeof analyticsMapping];
      if (!mappingInfo) continue; // Skip if no mapping is defined

      metrics.push({
        platform: mappingInfo.platform,
        metric_type: mappingInfo.metric_type,
        value: Math.round(value),
      });
    }
  }

  return metrics;
}