// app/api/soundcharts-data/route.ts
import { chromium } from 'playwright';
import { NextRequest, NextResponse } from 'next/server';
import { JSDOM } from 'jsdom';

export interface SoundchartsData {
  text: string;
  dataAttributes: Record<string, string>;
}

export interface LocationData {
  rank: string;
  location: string;
  views: string;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const artistSlug = searchParams.get('artist') || 'the-weeknd';

  const browserWs =
    process.env.BROWSER_WS ||
    'wss://brd-customer-hl_0b974442-zone-scraping_browser1:sm74ogqec9yu@brd.superproxy.io:9222';

  const email = process.env.SOUNDCHARTS_EMAIL;
  const password = process.env.SOUNDCHARTS_PASSWORD;

  if (!email || !password) {
    return NextResponse.json({ error: 'Soundcharts credentials not configured' }, { status: 500 });
  }

  console.log(`Connecting to browser for artist: ${artistSlug}...`);
  let browser = null;

  try {
    browser = await chromium.connectOverCDP(browserWs);

    console.log('Creating context and page...');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });

    const page = await context.newPage();

    // Navigate to artist page
    const artistUrl = `https://charts.youtube.com/artist/%2Fm%2F02z4b_8`;
    console.log(`Navigating to artist page: ${artistUrl}`);
    const response = await page.goto(artistUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    if (!response || !response.ok()) {
      throw new Error(`Failed to navigate to artist page: ${response?.status()}`);
    }

    console.log('Artist page initial load complete, waiting for content...');

    // Wait for the content to load
    console.log('Waiting for content to load...');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Additional 5 second wait
    // add a debug screenshot
    console.log('Taking debug screenshot...');
    await page.waitForSelector('#chart-entries-container', { timeout: 30000 });
    console.log('Chart entries container found, getting content...');
    const chartEntriesContent = await page.$eval('#chart-entries-container', el => el.innerHTML);
    console.log('Chart entries container content:', chartEntriesContent);
    console.log('Content loaded');

    // ↓ Call extractSoundchartsData if you still want that data
    console.log('Waiting for .ytmc-carousel-shelf-renderer-v2...');
    await page.waitForSelector('.ytmc-carousel-shelf-renderer-v2', { timeout: 30000 });
    console.log('Selector found, now extracting data...');
    // const soundchartsData = await extractSoundchartsData(page);
    // console.log('extractSoundchartsData returned:', soundchartsData);
    // const topLocations = await extractYtChartLocations(page);
    //console.log('extractYtChartLocations returned:', topLocations);
    const topLocations = parseLocationEntities(chartEntriesContent);
    // (1) Log the entire page HTML (be cautious with large output!)
    //const fullHtml = await page.content();
    // console.log('Full page HTML:', fullHtml);

    await browser.close();
    browser = null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      artistSlug,
      topLocations,
    });
  } catch (error: any) {
    console.error('Error during scraping:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

async function extractYtChartLocations(page: any): Promise<LocationData[]> {
  return await page.evaluate(() => {
    // Grab the container
    const container = document.querySelector('#chart-entries-container');

    // (2) Debug the container's HTML
    console.log('top-locations-carousel-shelf innerHTML was found');

    if (!container) return [];

    const rows = container.querySelectorAll('.ytmc-carousel-shelf-renderer-v2');
    return Array.from(rows).map(row => {
      return {
        rank: row.querySelector('.rankForInsightsPageLocationEntity')?.textContent?.trim() || '',
        location:
          row.querySelector('.entityTitleForInsightsPageLocationEntity')?.textContent?.trim() || '',
        views:
          row.querySelector('.subtitleForInsightsPageLocationEntity')?.textContent?.trim() || '',
      };
    });
  });
}

export function parseLocationEntities(chartEntriesContent: string) {
  const { document } = new JSDOM(chartEntriesContent).window;

  // We'll look for each .insightsPageLocationEntity
  const locationRows = document.querySelectorAll('.insightsPageLocationEntity');
  const items: Array<{ rank: string; title: string; views: string }> = [];

  locationRows.forEach(row => {
    const rank = row.querySelector('.rankForInsightsPageLocationEntity')?.textContent?.trim() || '';
    const title =
      row.querySelector('.entityTitleForInsightsPageLocationEntity')?.textContent?.trim() || '';
    const views =
      row.querySelector('.subtitleForInsightsPageLocationEntity')?.textContent?.trim() || '';

    items.push({ rank, title, views });
  });

  console.log('[parseLocationEntities] Found location rows:', locationRows.length);
  console.log('[parseLocationEntities] Data:', items);

  return items;
}
