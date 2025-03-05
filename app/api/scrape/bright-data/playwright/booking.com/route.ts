// app/api/booking-search/route.ts
import { chromium } from 'playwright';
import { NextRequest, NextResponse } from 'next/server';

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toBookingTimestamp(date: Date): string {
  return date.toISOString().split('T')[0];
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { location = 'New York', checkInDays = 1, checkOutDays = 2 } = body;

    // Configuration
    const BROWSER_WS =
      process.env.BROWSER_WS ||
      'wss://brd-customer-hl_0b974442-zone-scraping_browser1:sm74ogqec9yu@brd.superproxy.io:9222';
    const URL = 'https://www.booking.com/';

    // Calculate dates
    const now = new Date();
    const check_in = toBookingTimestamp(addDays(now, checkInDays));
    const check_out = toBookingTimestamp(addDays(now, checkOutDays));

    console.log('Connecting to browser...');
    const browser = await chromium.connectOverCDP(BROWSER_WS);

    console.log('Connected! Navigating to site...');
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('Waiting for popup...');
    await closePopup(page);

    console.log('Filling search form...');
    await interactWithForm(page, location, check_in, check_out);

    console.log('Parsing data...');
    const data = await parseResults(page);

    await browser.close();

    return NextResponse.json({
      success: true,
      location,
      checkIn: check_in,
      checkOut: check_out,
      results: data,
    });
  } catch (error: any) {
    console.error('Error during scraping:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function closePopup(page: any) {
  try {
    const close_btn = await page.waitForSelector('[aria-label="Dismiss sign-in info."]', {
      timeout: 25000,
      state: 'visible',
    });
    console.log('Popup appeared! Closing...');
    await close_btn.click();
    console.log('Popup closed!');
  } catch (e) {
    console.log("Popup didn't appear or timeout reached.");
  }
}

async function interactWithForm(page: any, searchText: string, checkIn: string, checkOut: string) {
  const search_input = await page.waitForSelector('[data-testid="destination-container"] input', {
    timeout: 60000,
  });

  await search_input.type(searchText);
  await page.click('[data-testid="searchbox-dates-container"] button');
  await page.waitForSelector('[data-testid="searchbox-datepicker-calendar"]');

  await page.click(`[data-date="${checkIn}"]`);
  await page.click(`[data-date="${checkOut}"]`);

  console.log('Form filled! Submitting and waiting for result...');

  // Create a promise for navigation
  const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });

  // Click the submit button
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await navigationPromise;
}

async function parseResults(page: any) {
  return await page.$$eval('[data-testid="property-card"]', (els: any[]) =>
    els.map(el => {
      const name = el.querySelector('[data-testid="title"]')?.innerText;
      const price = el.querySelector('[data-testid="price-and-discounted-price"]')?.innerText;
      const review_score = el.querySelector('[data-testid="review-score"]')?.innerText ?? '';
      const [score_str, , , reviews_str = ''] = review_score.split('\n');
      const score = parseFloat(score_str) || score_str;
      const reviews = parseInt(reviews_str.replace(/\D/g, '')) || reviews_str;
      return { name, price, score, reviews };
    })
  );
}
