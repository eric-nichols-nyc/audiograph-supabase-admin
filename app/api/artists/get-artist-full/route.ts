// app/api/artists/add/route.ts
import { NextResponse } from 'next/server';
import { getArtistInfo } from '@/services/artistInfo-service';
import { getViberateData } from '@/services/viberate-service';
import { scrapeKworbData } from '@/services/kworb-service';
import { convertViberateResponseToArtistMetrics } from '@/services/viberate-service';
import { createYoutubeService } from '@/services/youtube-service';
import { convertSpotifyTracksTrackType, createSpotifyService } from '@/services/spotify-service';
import { ArtistMetric, Track, Video } from '@/types/artists';
import { addFullArtist } from '@/services/add-artist-full';
//import { addFullArtist } from '@/services/test.service';
import { unstable_cache } from 'next/cache';

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

interface Metric {
  metric_type: string;
  value: number;
}


export function combineArtistName(artistName: string): string {
  // Trim whitespace, remove spaces and dashes, and convert to lowercase
  return artistName.trim().replace(/[\s-]+/g, '').toLowerCase();
}

export function slugify(artistName: string): string {
  // Trim whitespace, remove spaces and dashes, and convert to lowercase
  return artistName.trim().replace(/[\s-]+/g, '-').toLowerCase();
}


// Cache the individual data fetching functions
const cachedFetchArtistMetadata = unstable_cache(
  async (artistName: string, artistSpotifyId: string) => {
    return await getArtistInfo(artistName, artistSpotifyId);
  },
  ['artist-metadata'],
  { revalidate: 60 * 60 } // Cache for 1 hour
);

const cachedFetchAnalytics = unstable_cache(
  async (artistName: string) => {
    const analyticsData = await getViberateData(slugify(artistName));
    return convertViberateResponseToArtistMetrics(analyticsData);
  },
  ['artist-analytics'],
  { revalidate: 60 * 60 }
);

const cachedGetArtistVideoData = unstable_cache(
  async (artistName: string) => {
    const videoData = await scrapeKworbData(combineArtistName(artistName), 'videos');
    const {videos, stats} = videoData;
    const videoIds = videos.map((video:Video) => video.video_id);
    
    const youtubeService = createYoutubeService();
    const youtubeVideos = await youtubeService.getYoutubeVideos(videoIds);
    
    // Create a map of video details from YouTube API
    const videoDetails = new Map(youtubeVideos.map(video => [
      video.id,
      {
        title: video.snippet?.title || '',
        thumbnail_url: video.snippet?.thumbnails?.default?.url || '',
        view_count: Number(video.statistics?.viewCount) || 0,
        published_at: video.snippet?.publishedAt || '',
      }
    ]));

    // Combine Kworb data with YouTube data
    const enrichedVideos = videos.map((video: Video) => ({
      ...video,
      platform: 'youtube',
      thumbnail_url: videoDetails.get(video.video_id)?.thumbnail_url || '',
      published_at: videoDetails.get(video.video_id)?.published_at || video.published_at,
      view_count: videoDetails.get(video.video_id)?.view_count || video.view_count,
    }));

    const youtube_total_views: Omit<ArtistMetric, 'id' | 'date'> = {
      platform: 'youtube',
      metric_type: 'total_views',
      value: stats.find((stat: Metric) => stat.metric_type === 'total_views')?.value || 0,
    };

    const youtube_daily_views: Omit<ArtistMetric, 'id' | 'date'> = {
      platform: 'youtube',
      metric_type: 'daily_view_count',
      value: stats.find((stat: Metric) => stat.metric_type === 'current_daily_avg')?.value || 0,
    };

    return {
      stats: [youtube_total_views, youtube_daily_views],
      videos: enrichedVideos
    };
  },
  ['artist-videos'],
  { revalidate: 60 * 60 }
);

const cachedFetchTrackData = unstable_cache(
  async (artistName: string) => {
    const spotifyService = createSpotifyService();
    const trackData = await scrapeKworbData(artistName, 'tracks');
    const tracks = await Promise.all(trackData.tracks.map(async (track: any) => ({
      ...track,
      thumbnail_url: await spotifyService.getTrackImage(track.track_id)
    })));

    const currentDate = new Date().toISOString();
    // map the stats to the artist metric type
    const stats: Omit<ArtistMetric, 'id' | 'date'>[] = [
      { 
        platform: "spotify",
        metric_type: "total_streams", 
        value: trackData.stats.find((stat: Metric) => stat.metric_type === 'streams')?.value || 0,
      },
      { 
        platform: "spotify",
        metric_type: "daily_stream_count", 
        value: trackData.stats.find((stat: Metric) => stat.metric_type === 'daily')?.value || 0,
      }
    ];
    return {
      stats,
      tracks
    };
  },
  ['artist-tracks'],
  { revalidate: 60 * 60 }
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Received request body:', body);

    const { name, spotify_id, image_url, popularity, followers, genres } = body;
    if (!name || !spotify_id) {
      console.error('Validation error: Missing required fields', { name, spotify_id });
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

        // Use cached functions
        const metadata = await cachedFetchArtistMetadata(name, spotify_id);
        result.artist = metadata.artist;
        result.platformData = metadata.platformData;
        result.metricData = metadata.metricData;
        await sendUpdate('METADATA', 'Found artist on Spotify', 20);
        await sendUpdate('ANALYTICS', 'Fetching YouTube channel...', 30);
        const analyticsData = await cachedFetchAnalytics(name);
        result.metricData = analyticsData;
        await sendUpdate('ANALYTICS', 'Retrieved YouTube statistics', 40);
        await sendUpdate('VIDEO_DATA', 'Fetching YouTube video data...', 50);
        const videoData = await cachedGetArtistVideoData(name);
        const {stats, videos} = videoData;
        result.videos = videos;
        result.metricData = [...result.metricData, ...stats];
        await sendUpdate('VIDEO_DATA', 'Retrieved YouTube statistics', 40);
        await sendUpdate('TRACK_DATA', 'Fetching Spotify track data...', 50);
        const trackData = await cachedFetchTrackData(spotify_id);
        result.tracks = trackData.tracks;
        result.metricData = [...result.metricData, ...trackData.stats];
        await sendUpdate('TRACK_DATA', 'Retrieved Spotify data', 60);
        // Store Everything
        await sendUpdate('STORE', 'Saving artist data...', 80);
        console.log('SENDING RESULT TO DATABASE==========================',result);

        // Before calling addFullArtist
        console.log('Preparing data for validation:', {
          artistData: result.artist,
          platformDataCount: result.platformData.length,
          metricDataCount: result.metricData.length,
          tracksCount: result.tracks.length,
          videosCount: result.videos.length,
        });

        console.log('Sample video data structure:', {
          totalVideos: result.videos.length,
          firstVideo: result.videos[0],
          lastVideo: result.videos[result.videos.length - 1]
        });

        console.log('Sample track data structure:', {
          totalTracks: result.tracks.length,
          firstTrack: result.tracks[0],
          lastTrack: result.tracks[result.tracks.length - 1]
        });

        const insertedArtist = await addFullArtist(result);
        // Complete
        await sendUpdate('COMPLETE', 'Successfully added artist to database', 100, insertedArtist?.data);
        console.log('Sample video data:', result.videos[37]); // The one that's failing
        console.log('Sample track data:', result.tracks[1]); // The one that's failing

        return NextResponse.json(result);
      } catch (error) {
        console.error('Detailed error in artist processing:', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
        });

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
  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}