import 'server-only';

import { google } from 'googleapis';
import { unstable_cache } from 'next/cache';

type YoutubeChannelInfo = {
    youtube_channel_id: string;
    youtube_total_views: number;
    youtube_subcribers: number;
    fetchedAt: string;
}

interface YTVideo {
    video_id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    view_count: number;
    like_count: number;
    published_at: string;
}


export function createYoutubeService() {
    return new YoutubeService();
}

class YoutubeService {
    private youtube;
    private lastRequestTime: number = 0;
    private readonly API_KEY: string;
    private memoryCache: Map<string, {
        data: YoutubeChannelInfo, // Allow both single objects and arrays
        timestamp: number
    }>;

    constructor() {
        this.API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API!;
        this.youtube = google.youtube('v3');
        this.memoryCache = new Map();
    }

    private async rateLimitRequest<T>(request: Promise<T>): Promise<T> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < 100) { // Ensure 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
        }

        try {
            const result = await request;
            this.lastRequestTime = Date.now();
            return result;
        } catch (error) {
            console.error('YouTube API error:', error);
            throw error;
        }
    }

    public getArtistYoutubeInfo = unstable_cache(async (artistName: string): Promise<any | { error: string }> => {
        // Check if data is in cache
        const cacheKey = `youtube-channel-info-${artistName}`;
        const cachedData = this.memoryCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
            console.log('✅ Found in memory cache:', cacheKey);
            return cachedData.data;
        }

        try {
            console.log('❌ Not in memory cache, making fresh YouTube API call for:', artistName);
            const searchResponse = await this.rateLimitRequest(
                this.youtube.search.list({
                    key: this.API_KEY,
                    part: ['id'],
                    q: `${artistName} official channel`,
                    type: ['channel'],
                    order: 'relevance',
                    relevanceLanguage: 'en',
                    maxResults: 1
                })
            );

            const channelId = searchResponse.data.items?.[0]?.id?.channelId;

            if (!channelId) {
                console.log('No channel ID found, returning error.');
                return { error: `No YouTube channel found for artist: ${artistName}` };
            }

            // Get channel statistics
            const channelResponse = await this.rateLimitRequest(
                this.youtube.channels.list({
                    key: this.API_KEY,
                    part: ['statistics'],
                    id: [channelId]
                })
            );

            const channelStats = channelResponse.data.items?.[0]?.statistics;
            if (!channelStats) {
                console.log('No channel statistics found, returning error.');
                return { error: 'No channel statistics found' };
            }

            const result = {
                youtube_channel_id: channelId,
                youtube_total_views: parseInt(channelStats.viewCount || '0'),
                youtube_subcribers: parseInt(channelStats.subscriberCount || '0'),
                fetchedAt: new Date().toISOString()
            };

            console.log('YOUTUBE RESULT==========================', result);

            // Store in memory cache
            // console.log('Storing data in memory cache:', cacheKey);
            this.memoryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error fetching YouTube channel:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch YouTube channel';
            return { error: errorMessage };
        }
    }, [`youtube-channel-info`]);

    public getYoutubeVideos = unstable_cache(async (videoIds: string[]) => {
        try {
            const response = await this.rateLimitRequest(
                this.youtube.videos.list({
                    key: this.API_KEY,
                    part: ['snippet', 'statistics'],
                    id: videoIds
                })
            );

            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching video data:', error);
            return [];
        }
    }, ['youtube-videos'], { tags: ['youtube-videos'], revalidate: 60 * 60 * 24 });
}


interface Images {
    id: string;
    thumbnail_url: string | undefined;
}

interface Video {
    id: string | undefined | null;
    video_id: string;
    title: string;
    thumbnail_url: string;
    view_count: number;
    published_at: string;
}

export const convertYoutubeVideosVideoType = (videos: Video[], images: Images[]) => {
    return videos.map((video) => ({
        ...video,
        thumbnail_url: images.find((image) => image.id === video.video_id)?.thumbnail_url
    }));
}
