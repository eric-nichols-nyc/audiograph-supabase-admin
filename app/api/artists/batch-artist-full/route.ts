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
  try {
    const body = await req.json();
    const { name, spotify_id, image_url, popularity, followers, genres } = body;

    if (!name || !spotify_id || !popularity) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Start processing in background
    (async () => {
      try {
        await sendArtistUpdate(spotify_id, {
          stage: 'INIT',
          message: 'Starting process...',
          details: `Processing ${name}`,
          progress: 0
        });

        // Fetch metadata with error handling
        try {
          await sendArtistUpdate(spotify_id, {
            stage: 'METADATA',
            message: 'Fetching metadata...',
            details: `Getting data for ${name}`,
            progress: 25
          });
          
          const metadata = await cachedFetchArtistMetadata(name, spotify_id, popularity);
          console.log('Metadata fetched:', metadata);

          // Fetch analytics and media data
          await sendArtistUpdate(spotify_id, {
            stage: 'ANALYTICS',
            message: 'Processing analytics...',
            details: 'Fetching platform data',
            progress: 50
          });

          const analyticsPromise = cachedFetchAnalytics(name).catch(error => {
            console.error('Analytics fetch error:', error);
            return [];
          });

          const videoPromise = cachedGetArtistVideoData(name).catch(error => {
            console.error('Video fetch error:', error);
            return { stats: [], videos: [] };
          });

          const trackPromise = cachedFetchTrackData(spotify_id).catch(error => {
            console.error('Track fetch error:', error);
            return { stats: [], tracks: [] };
          });

          const [analyticsData, videoData, trackData] = await Promise.all([
            analyticsPromise,
            videoPromise,
            trackPromise
          ]);

          await sendArtistUpdate(spotify_id, {
            stage: 'MEDIA',
            message: 'Processing media...',
            details: 'Combining all data',
            progress: 75
          });

          // Create the artist object with required fields
          const artistData = {
            name,
            spotify_id,
            slug: slugify(name),
            bio: metadata.bio || '',
            gender: metadata.gender || 'unknown',
            country: metadata.country || 'US',
            birth_date: metadata.birth_date || new Date().toISOString(),
            image_url: image_url || '',
            genres: genres || [],
            is_complete: true,
            followers: followers || 0
          };

          // Combine all the data
          const result = {
            artist: artistData,
            platformData: metadata.platformData || [],
            metricData: [
              ...(analyticsData || []),
              ...(videoData?.stats || []),
              ...(trackData?.stats || []),
              {
                platform: 'spotify',
                metric_type: 'popularity',
                value: popularity || 0
              }
            ],
            videos: videoData?.videos || [],
            tracks: trackData?.tracks || []
          };

          // Store the data
          await sendArtistUpdate(spotify_id, {
            stage: 'STORE',
            message: 'Saving to database...',
            details: 'Finalizing artist data',
            progress: 90
          });

          const insertedArtist = await addFullArtist(result);
          console.log('Artist inserted:', insertedArtist);

          // Complete
          await sendArtistUpdate(spotify_id, {
            stage: 'COMPLETE',
            message: 'Processing complete',
            details: `Successfully processed ${name}`,
            progress: 100,
            payload: insertedArtist
          });

        } catch (error) {
          console.error('Metadata fetch error:', error);
          throw error;
        }

      } catch (error) {
        console.error('Processing error:', error);
        await sendArtistUpdate(spotify_id, {
          stage: 'ERROR',
          message: 'Processing failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          progress: 0
        });
      }
    })();

    // Return immediate response
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