// app/api/artists/add/route.ts
import { NextResponse } from 'next/server';
import { getArtistInfo } from '@/services/artistInfo-service';
import { getViberateData } from '@/services/viberate-service';
import { scrapeKworbData } from '@/services/kworb-service';
import { scrapeAndStoreWikipedia } from '@/services/wikipedia-service';
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
  STORE: 'Storing artist data',
  URL_DATA: 'Fetching URL data',
  ERROR: 'Error during ingestion'
} as const;

export function combineArtistName(artistName: string): string {
  // Trim whitespace, remove spaces and dashes, and convert to lowercase
  return artistName.trim().replace(/[\s-]+/g, '').toLowerCase();
}

export function slugify(artistName: string): string {
  // Trim whitespace, remove spaces and dashes, and convert to lowercase
  return artistName.trim().replace(/[\s-]+/g, '-').toLowerCase();
}


const fetchArtistMetadata = async (artistName: string, artistSpotifyId: string) => {
  try {
    return await getArtistInfo(artistName, artistSpotifyId);
  } catch (error) {
    throw new Error(`Failed to fetch artist metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const fetchAnalytics = async (artistName: string) => {
  try {
    return await getViberateData(slugify(artistName));
  } catch (error) {
    throw new Error(`Failed to fetch analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const getArtistVideoData = async (artistName: string) => {
  try {
    const videoData = await scrapeKworbData(combineArtistName(artistName), 'videos');
    console.log('*********videoData*******', videoData)
    return videoData;
  } catch (error) {
    throw new Error(`Failed to fetch video data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const fetchTrackData = async (artistName: string) => {
  console.log('*********fetchTrackData*******', artistName)
  try {
    const trackData = await scrapeKworbData(artistName, 'tracks');
    console.log('*********trackData*******', trackData)
    return trackData;
  } catch (error) {
    throw new Error(`Failed to fetch track data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const fetchWikipediaData = async (artistName: string) => {
  try {
    return await scrapeAndStoreWikipedia(artistName);
  } catch (error) {
    throw new Error(`Failed to fetch Wikipedia data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const fetchUrlData = async (artistName: string) => {
  try {
    // Mock data - replace with actual URL fetching logic
    return ['https://www.youtube.com/channel/UC-9-kyTW8ZkZNDHQJ6FgpwQ',
      'https://www.instagram.com/theweeknd/',
      'https://www.tiktok.com/@theweeknd'];
  } catch (error) {
    throw new Error(`Failed to fetch URL data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


export async function POST(req: Request) {
  const body = await req.json();
  console.log('get artist full body', body)
  const { name, spotify_id, image_url, popularity, followers, genres } = body;
  console.log('get artist full body', name, spotify_id, image_url, popularity, followers, genres)
  if (!name || !spotify_id) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const result: any = {
    artist: {
      name: name,
      spotify_id: spotify_id,
      image_url: image_url,
      popularity: popularity,
      followers: followers,
      genres: genres
    },
    platformData: [],
    urlData: [],
    metricData: [],
    tracks: [],
    videos: [],
    wikipedia: null
  };

  // Helper to send updates
  const sendUpdate = async (stage: keyof typeof STAGES, details: string, progress?: number, payload?: any) => {
    const message = `data: ${JSON.stringify({
      stage,
      message: STAGES[stage],
      details,
      progress,
      payload
    })}\n\n`;
    await writer.write(encoder.encode(message));
  };

  // Process in non-blocking way
  (async () => {
    try {

      // Initialize
      await sendUpdate('INIT', 'Starting artist ingestion process', 0);
      await new Promise(r => setTimeout(r, 1000)); // Small delay for UX

      // Spotify Data
      await sendUpdate('METADATA', 'Searching for artist...', 10);
      const metadata = await fetchArtistMetadata(name, spotify_id);
      result.artist = metadata.artist;
      result.platformData = metadata.platformData;
      await sendUpdate('METADATA', 'Found artist on Spotify', 20);
      await sendUpdate('ANALYTICS', 'Fetching YouTube channel...', 30);
      const analyticsData = await fetchAnalytics(name);
      result.metricData = analyticsData;
      await sendUpdate('ANALYTICS', 'Retrieved YouTube statistics', 40);
      const videoData = await getArtistVideoData(name);
      result.videos = videoData;
      await sendUpdate('TRACK_DATA', 'Retrieved YouTube statistics', 40);
      const trackData = await fetchTrackData(spotify_id);
      result.tracks = trackData;
      await sendUpdate('TRACK_DATA', 'Retrieved YouTube statistics', 40);
      await sendUpdate('URL_DATA', 'Fetching URL data...', 50);
      const urlData = await fetchUrlData(name);
      result.urlData = urlData;
      await sendUpdate('URL_DATA', 'Retrieved URL data', 60);
      await sendUpdate('WIKIPEDIA', 'Fetching Wikipedia article...', 85);
        const wikiData = await fetchWikipediaData(name);
      result.wikipedia = wikiData;
      await sendUpdate('WIKIPEDIA', 'Retrieved Wikipedia data', 90);

      // Store Everything
      await sendUpdate('STORE', 'Saving artist data...', 95);
     //  console.log('RESULT TO SEND TO DATABASE==========================', result);
      // const result = await ingestionService.ingestArtist({
      //   ...spotifyData,
      //   youtubeData,
      //   lastfmData,
      //   viberateData,
      //   wikiData
      // });

      // Complete
      await sendUpdate('COMPLETE', 'Successfully added artist to database', 100, result);
      return NextResponse.json(result);
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