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

// Add interface for YouTube Playlist
interface YTPlaylist {
    playlist_id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    item_count: number;
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
        data: any, // Use any to support different data types
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

    public getArtistYoutubeInfoByChannelId = unstable_cache(async (channelId: string): Promise<any | { error: string }> => {
        // Check if data is in cache
        const cacheKey = `youtube-channel-info-${channelId}`;
        const cachedData = this.memoryCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
            console.log('✅ Found in memory cache:', cacheKey);
            return cachedData.data;
        }

        try {


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
    }, [`youtube-channel-info-by-id`]);


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

    // return video info by video id
    public getVideoInfo = unstable_cache(async (videoId: string) => {
        try {
            const response = await this.rateLimitRequest(
                this.youtube.videos.list({
                    key: this.API_KEY,
                    part: ['snippet', 'statistics'],
                    id: [videoId]

                })
            );
            return response.data.items || [];

        } catch (error) {
            console.error('Error fetching video data:', error);
            return [];

        }
    }, ['youtube-video'], { tags: ['youtube-video'], revalidate: 60 * 60 * 24 });

    // Get all videos from a channel
    public getChannelVideos = unstable_cache(async (
        channelId: string,
        maxResults: number = 50,
        sortBy: 'date' | 'views' = 'date',
        minViews: number = 0
    ): Promise<{ videos: YTVideo[], total: number }> => {
        const cacheKey = `youtube-channel-videos-${channelId}-${sortBy}-${minViews}`;
        const cachedData = this.memoryCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < 6 * 60 * 60 * 1000) { // 6 hours cache
            console.log('✅ Found channel videos in memory cache:', cacheKey);
            return cachedData.data as { videos: YTVideo[], total: number };
        }

        try {
            console.log('❌ Not in memory cache, fetching channel videos from YouTube API for channel:', channelId);

            let videos: YTVideo[] = [];
            let nextPageToken: string | undefined = undefined;

            // YouTube API order parameter - only using 'date' as YouTube doesn't
            // directly support sorting by views in the API call
            const apiOrder = 'date';

            // Fetch videos from channel, handling pagination
            do {
                // Using any type to avoid type conflicts with the YouTube API response
                const searchResponse: any = await this.rateLimitRequest(
                    this.youtube.search.list({
                        key: this.API_KEY,
                        part: ['snippet'],
                        channelId: channelId,
                        maxResults: maxResults,
                        order: apiOrder,
                        type: ['video'],
                        pageToken: nextPageToken
                    })
                );

                if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
                    break;
                }

                // Get video IDs from search results
                const videoIds = searchResponse.data.items
                    .map((item: any) => item.id?.videoId)
                    .filter((id: any) => id) as string[];

                if (videoIds.length === 0) {
                    break;
                }

                // Get detailed video information
                const videosResponse = await this.rateLimitRequest(
                    this.youtube.videos.list({
                        key: this.API_KEY,
                        part: ['snippet', 'statistics'],
                        id: videoIds
                    })
                );

                if (videosResponse.data.items) {
                    const fetchedVideos = videosResponse.data.items.map(item => ({
                        video_id: item.id as string,
                        title: item.snippet?.title || '',
                        description: item.snippet?.description || '',
                        thumbnail_url: item.snippet?.thumbnails?.high?.url || '',
                        view_count: parseInt(item.statistics?.viewCount || '0'),
                        like_count: parseInt(item.statistics?.likeCount || '0'),
                        published_at: item.snippet?.publishedAt || ''
                    }));

                    videos = [...videos, ...fetchedVideos];
                }

                nextPageToken = searchResponse.data.nextPageToken;
            } while (nextPageToken);

            // Filter videos that have at least minViews views
            if (minViews > 0) {
                videos = videos.filter(video => video.view_count >= minViews);
            }

            // Sort videos according to the requested sort method
            // sort by most views first
            if (sortBy === 'views') {
                videos.sort((a, b) => b.view_count - a.view_count); // Sort by most views first
            } else {
                // Default sort by date (newest first)
                videos.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
            }

            const result = {
                videos,
                total: videos.length
            };

            // Store in memory cache
            this.memoryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error fetching channel videos:', error);
            return { videos: [], total: 0 };
        }
    }, ['youtube-channel-videos'], { tags: ['youtube-channel-videos'], revalidate: 60 * 60 * 6 });

    // Get all videos from a playlist
    public getPlaylistVideos = unstable_cache(async (
        playlistId: string,
        maxResults: number = 50,
        sortBy: 'date' | 'views' = 'date',
        minViews: number = 0
    ): Promise<{ videos: YTVideo[], total: number }> => {
        const cacheKey = `youtube-playlist-videos-${playlistId}-${sortBy}-${minViews}`;
        const cachedData = this.memoryCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < 6 * 60 * 60 * 1000) { // 6 hours cache
            console.log('✅ Found playlist videos in memory cache:', cacheKey);
            return cachedData.data as { videos: YTVideo[], total: number };
        }

        try {
            console.log('❌ Not in memory cache, fetching playlist videos from YouTube API for playlist:', playlistId);

            let videos: YTVideo[] = [];
            let nextPageToken: string | undefined = undefined;

            // Fetch videos from playlist, handling pagination
            do {
                // Get playlist items
                const playlistResponse: any = await this.rateLimitRequest(
                    this.youtube.playlistItems.list({
                        key: this.API_KEY,
                        part: ['snippet', 'contentDetails'],
                        playlistId: playlistId,
                        maxResults: maxResults,
                        pageToken: nextPageToken
                    })
                );

                if (!playlistResponse.data.items || playlistResponse.data.items.length === 0) {
                    break;
                }

                // Get video IDs from playlist items
                const videoIds = playlistResponse.data.items
                    .map((item: any) => item.contentDetails?.videoId)
                    .filter((id: any) => id) as string[];

                if (videoIds.length === 0) {
                    break;
                }

                // Get detailed video information
                const videosResponse = await this.rateLimitRequest(
                    this.youtube.videos.list({
                        key: this.API_KEY,
                        part: ['snippet', 'statistics'],
                        id: videoIds
                    })
                );

                if (videosResponse.data.items) {
                    const fetchedVideos = videosResponse.data.items.map(item => ({
                        video_id: item.id as string,
                        title: item.snippet?.title || '',
                        description: item.snippet?.description || '',
                        thumbnail_url: item.snippet?.thumbnails?.high?.url || '',
                        view_count: parseInt(item.statistics?.viewCount || '0'),
                        like_count: parseInt(item.statistics?.likeCount || '0'),
                        published_at: item.snippet?.publishedAt || ''
                    }));

                    videos = [...videos, ...fetchedVideos];
                }

                nextPageToken = playlistResponse.data.nextPageToken;
            } while (nextPageToken);

            // Filter videos that have at least minViews views
            if (minViews > 0) {
                videos = videos.filter(video => video.view_count >= minViews);
            }

            // Sort videos according to the requested sort method
            if (sortBy === 'views') {
                videos.sort((a, b) => b.view_count - a.view_count); // Sort by most views first
            } else {
                // Default sort by date (newest first)
                videos.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
            }

            const result = {
                total: videos.length,
                videos,
            };

            // Store in memory cache
            this.memoryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error fetching playlist videos:', error);
            return { videos: [], total: 0 };
        }
    }, ['youtube-playlist-videos'], { tags: ['youtube-playlist-videos'], revalidate: 60 * 60 * 6 });

    // Get all playlists from a channel
    public getChannelPlaylists = unstable_cache(async (
        channelId: string,
        maxResults: number = 50
    ): Promise<{ playlists: YTPlaylist[], total: number }> => {
        const cacheKey = `youtube-channel-playlists-${channelId}`;
        const cachedData = this.memoryCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < 12 * 60 * 60 * 1000) { // 12 hours cache
            console.log('✅ Found channel playlists in memory cache:', cacheKey);
            return cachedData.data as { playlists: YTPlaylist[], total: number };
        }

        try {
            console.log('❌ Not in memory cache, fetching channel playlists from YouTube API for channel:', channelId);

            let playlists: YTPlaylist[] = [];
            let nextPageToken: string | undefined = undefined;

            // Fetch playlists from channel, handling pagination
            do {
                const playlistsResponse: any = await this.rateLimitRequest(
                    this.youtube.playlists.list({
                        key: this.API_KEY,
                        part: ['snippet', 'contentDetails'],
                        channelId: channelId,
                        maxResults: maxResults,
                        pageToken: nextPageToken
                    })
                );

                if (!playlistsResponse.data.items || playlistsResponse.data.items.length === 0) {
                    break;
                }

                const fetchedPlaylists = playlistsResponse.data.items.map((item: any) => ({
                    playlist_id: item.id,
                    title: item.snippet?.title || '',
                    description: item.snippet?.description || '',
                    thumbnail_url: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url || '',
                    item_count: parseInt(item.contentDetails?.itemCount || '0'),
                    published_at: item.snippet?.publishedAt || ''
                }));

                playlists = [...playlists, ...fetchedPlaylists];
                nextPageToken = playlistsResponse.data.nextPageToken;
            } while (nextPageToken);

            // Sort playlists by date (newest first)
            playlists.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

            const result = {
                total: playlists.length,
                playlists
            };

            // Store in memory cache
            this.memoryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error fetching channel playlists:', error);
            return { playlists: [], total: 0 };
        }
    }, ['youtube-channel-playlists'], { tags: ['youtube-channel-playlists'], revalidate: 60 * 60 * 12 });

    // Get popular videos based on a search query
    public getPopularVideos = unstable_cache(async (
        query: string,
        maxResults: number = 50,
        minViews: number = 0
    ): Promise<{ videos: YTVideo[], total: number }> => {
        const cacheKey = `youtube-popular-videos-${query}-${minViews}`;
        const cachedData = this.memoryCache.get(cacheKey);
        if (cachedData && Date.now() - cachedData.timestamp < 6 * 60 * 60 * 1000) { // 6 hours cache
            console.log('✅ Found popular videos in memory cache:', cacheKey);
            return cachedData.data as { videos: YTVideo[], total: number };
        }

        try {
            console.log('❌ Not in memory cache, fetching popular videos from YouTube API for query:', query);

            let videos: YTVideo[] = [];
            let nextPageToken: string | undefined = undefined;

            // Fetch popular videos based on search query, handling pagination
            do {
                // First, search for videos matching the query
                const searchResponse: any = await this.rateLimitRequest(
                    this.youtube.search.list({
                        key: this.API_KEY,
                        part: ['snippet'],
                        q: query,
                        type: ['video'],
                        maxResults: maxResults,
                        order: 'viewCount', // Sort by view count to get popular videos
                        pageToken: nextPageToken
                    })
                );

                if (!searchResponse.data.items || searchResponse.data.items.length === 0) {
                    break;
                }

                // Get video IDs from search results
                const videoIds = searchResponse.data.items
                    .map((item: any) => item.id?.videoId)
                    .filter((id: any) => id) as string[];

                if (videoIds.length === 0) {
                    break;
                }

                // Get detailed video information including statistics
                const videosResponse = await this.rateLimitRequest(
                    this.youtube.videos.list({
                        key: this.API_KEY,
                        part: ['snippet', 'statistics'],
                        id: videoIds
                    })
                );

                if (videosResponse.data.items) {
                    const fetchedVideos = videosResponse.data.items.map(item => ({
                        video_id: item.id as string,
                        title: item.snippet?.title || '',
                        description: item.snippet?.description || '',
                        thumbnail_url: item.snippet?.thumbnails?.high?.url || '',
                        view_count: parseInt(item.statistics?.viewCount || '0'),
                        like_count: parseInt(item.statistics?.likeCount || '0'),
                        published_at: item.snippet?.publishedAt || ''
                    }));

                    videos = [...videos, ...fetchedVideos];
                }

                nextPageToken = searchResponse.data.nextPageToken;
            } while (nextPageToken);

            // Filter videos that have at least minViews views
            if (minViews > 0) {
                videos = videos.filter(video => video.view_count >= minViews);
            }

            // Sort videos by view count (highest first)
            videos.sort((a, b) => b.view_count - a.view_count);

            const result = {
                total: videos.length,
                videos
            };

            // Store in memory cache
            this.memoryCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });

            return result;
        } catch (error) {
            console.error('Error fetching popular videos:', error);
            return { videos: [], total: 0 };
        }
    }, ['youtube-popular-videos'], { tags: ['youtube-popular-videos'], revalidate: 60 * 60 * 6 });
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
