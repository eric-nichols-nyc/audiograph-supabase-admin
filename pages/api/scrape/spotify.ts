import { chromium } from 'playwright';
import type { NextApiRequest, NextApiResponse } from 'next';

// Your Bright Data proxy credentials
const PROXY_USERNAME = process.env.BRIGHT_DATA_PROXY_USERNAME;
const PROXY_PASSWORD = process.env.BRIGHT_DATA_PROXY_PASSWORD;
const PROXY_SERVER = process.env.BRIGHT_DATA_PROXY_SERVER || 'brd.superproxy.io:22225';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    // Get artist IDs from request
    const { artistIds } = req.body;
    
    if (!artistIds || !Array.isArray(artistIds)) {
      return res.status(400).json({ error: 'Invalid request: artistIds array required' });
    }
    
    // Configure browser with proxy
    const browser = await chromium.launch({
      proxy: {
        server: `http://${PROXY_SERVER}`,
        username: PROXY_USERNAME,
        password: PROXY_PASSWORD
      }
    });
    
    const results = [];
    const page = await browser.newPage();
    
    // Process each artist (up to 10 at a time to avoid timeouts)
    const batchSize = 10;
    for (let i = 0; i < Math.min(artistIds.length, batchSize); i++) {
      const artistId = artistIds[i];
      try {
        console.log(`Scraping Spotify data for artist ID: ${artistId}`);
        
        // Navigate to artist page
        await page.goto(`https://open.spotify.com/artist/${artistId}`, { 
          waitUntil: 'networkidle' 
        });
        
        // Extract monthly listeners
        const listeners = await page.evaluate(() => {
          // This selector will need to be updated based on Spotify's actual DOM structure
          const listenerText = document.querySelector('[data-testid="monthly-listeners-label"]')?.textContent;
          if (!listenerText) return null;
          
          // Extract number from text like "1,234,567 monthly listeners"
          const match = listenerText.match(/([0-9,]+)\s+monthly listeners/i);
          return match ? parseInt(match[1].replace(/,/g, '')) : null;
        });
        
        results.push({
          spotifyId: artistId,
          name: await page.title().then(title => title.replace(' | Spotify', '')),
          listeners: listeners || 0
        });
      } catch (artistError) {
        console.error(`Error scraping artist ${artistId}:`, artistError);
        results.push({
          spotifyId: artistId,
          error: artistError.message
        });
      }
    }
    
    await browser.close();
    
    return res.status(200).json({
      success: true,
      results
    });
  } catch (error) {
    console.error('Error in Spotify scraping:', error);
    return res.status(500).json({ 
      error: 'Failed to scrape Spotify data',
      details: error.message 
    });
  }
} 