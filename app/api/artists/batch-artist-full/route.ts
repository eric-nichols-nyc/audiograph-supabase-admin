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
import { sendArtistUpdate } from '../progress/[spotify_id]/route';
import { getUser } from '@/lib/supabase/auth/server';

// Simplified stages
const STAGES = {
  INIT: 'Adding Artist',
  METADATA: 'Processing Metadata',
  ANALYTICS: 'Processing Analytics',
  MEDIA: 'Processing Media',
  STORE: 'Saving Data',
  COMPLETE: 'Complete',
  ERROR: 'Error'
} as const;

interface Metric {
  metric_type: string;
  value: number;
}

// Add type for metric types
type MetricType =
  | "popularity"
  | "followers"
  | "views"
  | "likes"
  | "subscribers"
  | "monthly_listeners"
  | "daily_view_count"
  | "daily_stream_count"
  | "total_views"
  | "total_streams";

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
  async (artistName: string, artistSpotifyId: string, popularity: number) => {
    try {
      console.log('🔍 Fetching artist metadata for:', artistName);
      const data = await getArtistInfo(artistName, artistSpotifyId, popularity);
      return data;
    } catch (error) {
      console.error('Error fetching artist metadata:', error);
      throw new Error(`Failed to fetch metadata for ${artistName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  ['artist-metadata'],
  { revalidate: 60 * 60 }
);

const cachedFetchAnalytics = unstable_cache(
  async (artistName: string) => {
    try {
      console.log('🔍 Fetching analytics for:', artistName);
      const analyticsData = await getViberateData(slugify(artistName));
      return convertViberateResponseToArtistMetrics(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw new Error(`Failed to fetch analytics for ${artistName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  ['artist-analytics'],
  { revalidate: 60 * 60 }
);

const cachedGetArtistVideoData = unstable_cache(
  async (artistName: string) => {
    try {
      console.log('🔍 Fetching video data for:', artistName);
      const videoData = await scrapeKworbData(combineArtistName(artistName), 'videos');
      // console.log('Raw video data:', videoData);
      const { videos, stats } = videoData;
      const videoIds = videos.map((video: Video) => video.video_id);

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

      console.log('Enriched videos sample:', enrichedVideos[0]);

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
    } catch (error) {
      console.error('Error fetching video data:', error);
      throw new Error(`Failed to fetch video data for ${artistName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  ['artist-videos'],
  { revalidate: 60 * 60 }
);

const cachedFetchTrackData = unstable_cache(
  async (artistName: string) => {
    try {
      console.log('🔍 Fetching track data for:', artistName);
      const spotifyService = createSpotifyService();
      const trackData = await scrapeKworbData(artistName, 'tracks');
      const tracks = await Promise.all(trackData.tracks.map(async (track: any) => ({
        ...track,
        thumbnail_url: await spotifyService.getTrackImage(track.track_id)
      })));

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
    } catch (error) {
      console.error('Error fetching track data:', error);
      throw new Error(`Failed to fetch track data for ${artistName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  ['artist-tracks'],
  { revalidate: 60 * 60 }
);

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, spotify_id, popularity = 0 } = body;

    if (!name || !spotify_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start processing in background
    (async () => {
      try {
        // First stage - INIT
        await sendArtistUpdate(spotify_id, {
          stage: 'INIT',
          progress: 0,
          message: `Starting process for ${name}`,
          details: 'Initializing...'
        });

        // Second stage - METADATA
        await sendArtistUpdate(spotify_id, {
          stage: 'METADATA',
          progress: 25,
          message: 'Fetching artist metadata',
          details: `Processing ${name}`
        });

        // Pass required popularity parameter
        const metadata = await cachedFetchArtistMetadata(name, spotify_id, popularity);

        // Analytics stage
        await sendArtistUpdate(spotify_id, {
          stage: 'ANALYTICS',
          progress: 50,
          message: 'Processing analytics',
          details: 'Fetching platform data'
        });

        const [analyticsData, videoData, trackData] = await Promise.all([
          cachedFetchAnalytics(name),
          cachedGetArtistVideoData(name),
          cachedFetchTrackData(spotify_id)
        ]);

        // Store stage
        await sendArtistUpdate(spotify_id, {
          stage: 'STORE',
          progress: 75,
          message: 'Saving to database',
          details: 'Almost done'
        });

        // Process and store the data
        const result = {
          artist: {
            name,
            spotify_id,
            slug: slugify(name),
            bio: metadata.bio || '',
            gender: metadata.gender || 'unknown',
            country: metadata.country || 'US',
            birth_date: metadata.birth_date || new Date().toISOString(),
            // Use image_url from body instead of metadata
            image_url: body.image_url || '',
            // Use genres from body instead of metadata
            genres: body.genres || [],
            is_complete: true,
            // Use followers from body instead of metadata
            followers: body.followers || 0
          },
          platformData: metadata.platformData || [],
          metricData: [
            ...(analyticsData || []),
            ...(videoData?.stats || []),
            ...(trackData?.stats || []),
            {
              platform: 'spotify' as const,
              metric_type: 'popularity' as MetricType,
              value: popularity
            }
          ],
          videos: videoData?.videos || [],
          tracks: trackData?.tracks || []
        };

        await addFullArtist(result);

        // Complete
        await sendArtistUpdate(spotify_id, {
          stage: 'COMPLETE',
          progress: 100,
          message: 'Processing complete',
          details: `Successfully processed ${name}`
        });

      } catch (error) {
        console.error('Processing error:', error);
        await sendArtistUpdate(spotify_id, {
          stage: 'ERROR',
          progress: 0,
          message: 'Processing failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    })();

    return NextResponse.json({ message: 'Processing started' });

  } catch (error) {
    console.error('Route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const artistId = searchParams.get('artistId');
  console.log('Artist ID:', artistId);
  return NextResponse.json({ message: 'Artist ID received' });
}