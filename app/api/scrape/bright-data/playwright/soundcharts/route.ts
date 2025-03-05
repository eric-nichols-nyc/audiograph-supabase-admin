// app/api/soundcharts-data/route.ts
import { chromium } from 'playwright';
import { NextRequest, NextResponse } from 'next/server';

export interface SoundchartsData {
  text: string;
  dataAttributes: Record<string, string>;
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

    // Go to login page
    console.log('Navigating to Soundcharts login page...');
    await page.goto('https://app.soundcharts.com/', { waitUntil: 'networkidle', timeout: 60000 });

    // Check if we need to log in
    const loginButtonExists = await page.isVisible('button:has-text("Log in")');

    if (loginButtonExists) {
      console.log('Performing login...');
      await page.click('button:has-text("Log in")');

      // Fill login form
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      await page.click('button[type="submit"]');

      // Wait for login to complete
      await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 });
      console.log('Login successful');
    } else {
      console.log('Already logged in or login button not found');
    }

    // Navigate to artist page
    const artistUrl = `https://app.soundcharts.com/app/artist/${artistSlug}/overview`;
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
    await page.screenshot({ path: 'debug-before-extraction.png', fullPage: true });
    await page.waitForSelector('.sc-kxyuPp', { timeout: 30000 });
    console.log('Content loaded');
    const html = await page.content();
    console.log('Page HTML:', html);

    // Take screenshot
    // Extract data from the specified class
    console.log('Extracting data from .sc-iGPElx...');
    const data = await extractSoundchartsData(page);

    await browser.close();
    browser = null;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      artistSlug,
      data,
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

async function extractSoundchartsData(page: any): Promise<SoundchartsData[]> {
  // First, let's do some logging to see what's actually on the page
  await page.screenshot({ path: 'soundcharts-debug.png' });

  return await page.evaluate(() => {
    // Let's try multiple selectors that might contain the data we're looking for
    const statElements = Array.from(
      document.querySelectorAll(
        '.social-evolution-details, .social-stats, .stat-card, [data-testid*="social"], [class*="social"]'
      )
    );

    console.log('Found elements:', statElements.length);

    if (statElements.length === 0) {
      // If our specific selectors fail, let's get all potential data elements
      const allCards = Array.from(
        document.querySelectorAll('[class*="card"], [class*="stat"], [class*="metrics"]')
      );
      console.log('Fallback elements:', allCards.length);

      return allCards.map(element => {
        return {
          html: element.outerHTML.substring(0, 200) + '...', // For debugging
          label:
            element
              .querySelector('h3, h4, [class*="title"], [class*="label"]')
              ?.textContent?.trim() || 'Unknown',
          value:
            element
              .querySelector('[class*="value"], [class*="count"], strong, b')
              ?.textContent?.trim() || 'Unknown',
        };
      });
    }

    return statElements.map(element => {
      // Try to extract structured data
      return {
        label:
          element
            .querySelector(
              '.social-details, .social-details-title, [class*="title"], [class*="label"]'
            )
            ?.textContent?.trim() || 'Unknown',
        value:
          element
            .querySelector('.social-details-value, [class*="value"], [class*="count"], strong, b')
            ?.textContent?.trim() || 'Unknown',
        dataAttributes: Object.fromEntries(
          Array.from(element.attributes)
            .filter(attr => attr.name.startsWith('data-'))
            .map(attr => [attr.name, attr.value])
        ),
      };
    });
  });
}
