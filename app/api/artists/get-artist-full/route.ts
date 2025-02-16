// app/api/artists/add/route.ts
import { NextResponse } from 'next/server';
import { getArtistInfo } from '@/services/artistInfo-service';
import { getViberateData } from '@/services/viberate-service';
import { scrapeKworbData } from '@/services/kworb-service';
import { scrapeAndStoreWikipedia } from '@/services/wikipedia-service';
import { convertViberateResponseToArtistMetrics } from '@/services/viberate-service';
import { createYoutubeService, convertYoutubeVideosVideoType } from '@/services/youtube-service';
import { convertSpotifyTracksTrackType, createSpotifyService } from '@/services/spotify-service';
import { ArtistMetric, Track, Video } from '@/types/artists';
import { addArtistFull } from '@/services/add-artist-full';
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

const fetchAnalytics = async (artistName: string): Promise<ArtistMetric[]> => {
  try {
    const analyticsData = await getViberateData(slugify(artistName));
    const metrics = convertViberateResponseToArtistMetrics(analyticsData);
    return metrics;
  } catch (error) {
    throw new Error(`Failed to fetch analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const getArtistVideoData = async (artistName: string): Promise<{
  stats: ArtistMetric[],
  videos: Video[]
}> => {
  try {
    const videoData = await scrapeKworbData(combineArtistName(artistName), 'videos');
    const {videos, stats} = videoData;
    const videoIds = videos.map((video:Video) => video.video_id);
    // No, this needs to stay inside the function since createYoutubeService() 
    // initializes a new service instance that should be scoped to each request
    const youtubeService = createYoutubeService();
    const youtubeVideos = await youtubeService.getYoutubeVideos(videoIds);
    const ytvids = youtubeVideos.map((video) => ({
      id: video.id || '',
      title: video.snippet?.title || '',
      thumbnail_url: video.snippet?.thumbnails?.default?.url ?? '',
      view_count: Number(video.statistics?.viewCount) ?? 0,
      published_at: video.snippet?.publishedAt || '',
    }));

    const statsMetrics: ArtistMetric = {
      platform: 'youtube',
      metric_type: 'total_views' as 'total_views',
      value: stats.find((stat: any) => stat.metric === 'total_views')?.value || 0,
    };

    const youtubeVideosWithStats = convertYoutubeVideosVideoType(videos, ytvids);
    return {
      stats: [statsMetrics],
      videos: youtubeVideosWithStats
    };
  } catch (error) {
    throw new Error(`Failed to fetch video data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

  const fetchTrackData = async (artistName: string): Promise<{
    stats: ArtistMetric[],
    tracks: Track[]
  }> => {
    try {
      const spotifyService = createSpotifyService();
      const trackData = await scrapeKworbData(artistName, 'tracks');
      
      const tracks = await Promise.all(trackData.tracks.map(async (track: any) => ({
        ...track,
        thumbnail_url: await spotifyService.getTrackImage(track.track_id)
      })));

      const stats: ArtistMetric[] = [
        { 
          platform: "spotify",
          metric_type: "total_streams", 
          value: trackData.stats.find((stat: any) => stat.metric === 'streams')?.value || 0 
        },
        { 
          platform: "spotify",
          metric_type: "daily_stream_count", 
          value: trackData.stats.find((stat: any) => stat.metric === 'daily')?.value || 0 
        }
      ];
      return {
        stats,
        tracks
      };
    } catch (error) {
      throw new Error(`Failed to fetch track data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }


export async function POST(req: Request) {
  const body = await req.json();
  const { name, spotify_id, image_url, popularity, followers, genres } = body;
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
      result.metricData = metadata.metricData;
      await sendUpdate('METADATA', 'Found artist on Spotify', 20);
      await sendUpdate('ANALYTICS', 'Fetching YouTube channel...', 30);
      const analyticsData = await fetchAnalytics(name);
      result.metricData = analyticsData;
      await sendUpdate('ANALYTICS', 'Retrieved YouTube statistics', 40);
      await sendUpdate('VIDEO_DATA', 'Fetching YouTube video data...', 50);
      const videoData = await getArtistVideoData(name);
      const {stats, videos} = videoData;
      result.videos = videos;
      result.metricData = [...result.metricData, ...stats];
      await sendUpdate('VIDEO_DATA', 'Retrieved YouTube statistics', 40);
      await sendUpdate('TRACK_DATA', 'Fetching Spotify track data...', 50);
      const trackData = await fetchTrackData(spotify_id);
      result.tracks = trackData.tracks;
      result.metricData = [...result.metricData, ...trackData.stats];
      await sendUpdate('TRACK_DATA', 'Retrieved Spotify data', 60);
      await sendUpdate('WIKIPEDIA', 'Fetching Wikipedia article...', 85);
      const wikiData = await new Promise(resolve => {
        new Promise(resolve => {
          setTimeout(() => {
            resolve("wikiData done");
          }, 2000);
        });
      });
      result.wikipedia = wikiData;
      await sendUpdate('WIKIPEDIA', 'Retrieved Wikipedia data', 90);

      // Store Everything
      await sendUpdate('STORE', 'Saving artist data...', 95);
     // console.log('RESULT TO SEND TO DATABASE==========================', result);
      const insertedArtist = await addArtistFull(result);

      // Complete
      await sendUpdate('COMPLETE', 'Successfully added artist to database', 100, insertedArtist);
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