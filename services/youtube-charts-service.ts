import puppeteer from 'puppeteer';

export async function scrapeYouTubeCharts(artistId: string) {
  // Ensure artistId is properly encoded
  const encodedId = encodeURIComponent(artistId);
  const url = `https://charts.youtube.com/artist/${encodedId}`;
  
  console.log(`Scraping YouTube Charts for artist: ${artistId}`);
  
  const browser = await puppeteer.launch({
    headless: 'new', // Use new headless mode
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport to desktop size
    await page.setViewport({ width: 1280, height: 800 });
    
    // Navigate to the page
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Wait for the charts to load
    await page.waitForSelector('.chart-item', { timeout: 5000 });
    
    // Extract data
    const data = await page.evaluate(() => {
      // This runs in the browser context
      const result = {
        subscriberCount: null,
        topTracks: [],
        recentVideos: [],
        chartPositions: []
      };
      
      // Get subscriber count
      const subCountEl = document.querySelector('.subscriber-count');
      if (subCountEl) {
        result.subscriberCount = subCountEl.textContent;
      }
      
      // Get top tracks
      const trackElements = document.querySelectorAll('.track-item');
      trackElements.forEach(el => {
        result.topTracks.push({
          title: el.querySelector('.track-title')?.textContent,
          views: el.querySelector('.track-views')?.textContent,
          rank: el.querySelector('.track-rank')?.textContent
        });
      });
      
      // Similar code for videos and chart positions...
      
      return result;
    });
    
    return data;
  } catch (error) {
    console.error('Error scraping YouTube Charts:', error);
    throw error;
  } finally {
    await browser.close();
  }
} 