import { chromium } from 'playwright';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';
import randomUserAgent from 'random-useragent';
//chromium.use(stealthPlugin());

export async function GET(request: Request) {
  try {
    // Launch a Chromium instance with the stealth plugin enabled
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to the target page (adjust the URL as needed)
    await page.goto('https://open.spotify.com/a
    await page.getByText('London, GB').click();rtist/1uNFoZAHBGtllmzznpCI3s', { waitUntil: 'networkidle' });

    // Scroll down dynamically until no new content loads
    let prevHeight = 0;

    // Wait for and click the target div (adjust the selector as needed)
    const divSelector = 'button[title="Justin Bieber"]'; // Selector for artist button
    await page.waitForSelector(divSelector, { timeout: 5000 });
    await page.click(divSelector);

    console.log("Clicked the div!");

    // Wait for the dialog to appear
    const dialogSelector = '[data-testid="dialog-body"]'; // Spotify dialog element
    await page.waitForSelector(dialogSelector, { timeout: 5000 }); // Wait for dialog to show
  
    console.log("Dialog appeared!");
  
    // Scrape content from the dialog
    const dialogContent = await page.evaluate((selector) => {
      const element = document.querySelector(selector);
      return element ? element.innerText.trim() : 'Dialog not found';
    }, dialogSelector);
  
    console.log("Scraped Dialog Content:", dialogContent);

    await browser.close();

    return new Response(JSON.stringify({ dialogContent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error in Spotify scraper:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export const unstable_cache = 'force-cache';
