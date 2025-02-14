// app/api/artists/add/route.ts
import { NextResponse } from 'next/server';
import { getArtistInfo } from '@/services/artistInfo-service';
import { getViberateData } from '@/services/viberate-service';
import { getKworbData } from '@/services/kworb-service';
//import { OpenAIService } from '@/services/openai-service';
import { createYoutubeService } from '@/services/youtube-service';
import { createSpotifyService } from '@/services/spotify-service';

const STAGES = {
  INIT: 'Initializing artist ingestion',
  METADATA: 'Fetching metadata',
  ANALYTICS: 'Fetching analytics data',
  VIDEO_DATA: 'Fetching video data',
  TRACK_DATA: 'Fetching track data',
  WIKIPEDIA: 'Fetching Wikipedia data',
  COMPLETE: 'Artist ingestion complete',
  ERROR: 'Error during ingestion'
} as const;

export async function POST(req: Request) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const result: any = {
    artist: null,
    platformData: [],
    urlData: [],
    metricData: [],
    tracks: [],
    videos: [],
  };

  // Helper to send updates
  const sendUpdate = async (stage: keyof typeof STAGES, details: string, progress?: number) => {
    const message = `data: ${JSON.stringify({ 
      stage, 
      message: STAGES[stage],
      details,
      progress 
    })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Process in non-blocking way
  (async () => {
    // const ingestionService = new ArtistIngestionService();
    // const openAIService = new OpenAIService();
    // const youtubeService = new YouTubeService();

    try {
      const { artistName, artistSpotifyId } = await req.json();

      // Initialize
      await sendUpdate('INIT', 'Starting artist ingestion process', 0);
      await new Promise(r => setTimeout(r, 1000)); // Small delay for UX

      // Spotify Data
      await sendUpdate('SPOTIFY', 'Searching for artist...', 10);
      //const spotifyData = await ingestionService.getSpotifyArtistData(artistName);
      await new Promise(r => setTimeout(r, 1000)); 
      await sendUpdate('SPOTIFY', 'Found artist on Spotify', 20);

      // YouTube Data
      await sendUpdate('YOUTUBE', 'Fetching YouTube channel...', 30);
      //const youtubeData = await youtubeService.getChannelInfo(artistName);
      await new Promise(r => setTimeout(r, 1000)); 
      await sendUpdate('YOUTUBE', 'Retrieved YouTube statistics', 40);

      // Viberate Data
      await sendUpdate('VIBERATE', 'Scraping Viberate metrics...', 70);
      //const viberateData = await ingestionService.scrapeViberateData(artistName);
      await new Promise(r => setTimeout(r, 1000)); 
      // await Promise.reject(new Error('Failed to fetch Viberate data'));
      await sendUpdate('VIBERATE', 'Retrieved Viberate data', 80);

      // Wikipedia
      await sendUpdate('WIKIPEDIA', 'Fetching Wikipedia article...', 85);
      //const wikiData = await ingestionService.getWikipediaInfo(artistName);
      await new Promise(r => setTimeout(r, 1000)); 
      await sendUpdate('WIKIPEDIA', 'Retrieved Wikipedia data', 90);

      // Store Everything
      await sendUpdate('STORE', 'Saving artist data...', 95);
      // const result = await ingestionService.ingestArtist({
      //   ...spotifyData,
      //   youtubeData,
      //   lastfmData,
      //   viberateData,
      //   wikiData
      // });

      // Complete
      await sendUpdate('COMPLETE', 'Successfully added artist to database', 100);

    } catch (error) {
      console.error('Artist ingestion error:', error);
      await sendUpdate(
        'ERROR',
        error instanceof Error ? error.message : 'Failed to process artist',
        0
      );
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}