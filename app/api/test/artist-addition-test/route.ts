import { NextResponse } from 'next/server';
import { DeezerService } from '@/services/deezer-service';

// Function to get Deezer ID from Artist Info Service
async function getDeezerIdFromArtistInfo(artistName: string) {
    try {
        // This is a placeholder for the actual Artist Info Service call
        // In a real implementation, you would call the Artist Info Service here
        console.log('🔍 Getting Deezer ID for:', artistName);

        // For testing, we'll simulate finding a Deezer ID
        // In production, this would come from your Artist Info Service
        return "123456"; // Example Deezer ID
    } catch (error) {
        console.error('Error getting Deezer ID:', error);
        return null;
    }
}

// Function to get all platform IDs
async function getAllPlatformIds(artistName: string, spotifyId: string) {
    try {
        // Get Deezer ID from Artist Info Service
        const deezerId = await getDeezerIdFromArtistInfo(artistName);

        return {
            spotify: spotifyId,
            deezer: deezerId,
            // Add other platform IDs as needed
        };
    } catch (error) {
        console.error('Error getting platform IDs:', error);
        // Return whatever IDs we were able to get
        return {
            spotify: spotifyId,
        };
    }
}

// Function to fetch YouTube data for an artist
async function getYouTubeData(artistName: string) {
    try {
        // This is a placeholder for the actual YouTube API call
        console.log('🔍 Fetching YouTube data for:', artistName);

        // Example response structure
        return {
            subscribers: 1000000,
            totalViews: 50000000,
        };
    } catch (error) {
        console.error('Error fetching YouTube data:', error);
        throw new Error(`Failed to fetch YouTube data for ${artistName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to fetch Spotify data for an artist
async function getSpotifyData(spotifyId: string) {
    try {
        // This is a placeholder for the actual Spotify API call
        console.log('🔍 Fetching Spotify data for:', spotifyId);

        // Example response structure
        return {
            followers: 5000000,
            popularity: 85,
        };
    } catch (error) {
        console.error('Error fetching Spotify data:', error);
        throw new Error(`Failed to fetch Spotify data for ${spotifyId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to fetch Deezer data for an artist
async function getDeezerData(deezerId: string) {
    try {
        // Use the DeezerService to fetch artist data by ID
        console.log('🔍 Fetching Deezer data for ID:', deezerId);

        const deezerArtist = await DeezerService.getArtistById(deezerId);

        if (!deezerArtist) {
            throw new Error(`Artist not found on Deezer with ID: ${deezerId}`);
        }

        // Extract the relevant data - properties are directly on deezerArtist
        return {
            followers: deezerArtist.nb_fan,
            albums: deezerArtist.nb_album,
            // Add other Deezer metrics as needed
        };
    } catch (error) {
        console.error('Error fetching Deezer data:', error);
        throw new Error(`Failed to fetch Deezer data for ID ${deezerId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to fetch Spotify artist metadata
async function getSpotifyArtistMetadata(spotifyId: string) {
    try {
        // This is a placeholder for the actual Spotify API call
        console.log('🔍 Fetching Spotify artist metadata for:', spotifyId);

        // Example response structure
        return {
            name: 'Test Artist',
            images: [{ url: 'https://example.com/image.jpg' }],
            genres: ['pop', 'rock'],
            popularity: 85,
            followers: { total: 5000000 },
        };
    } catch (error) {
        console.error('Error fetching Spotify artist metadata:', error);
        throw new Error(`Failed to fetch Spotify artist metadata for ${spotifyId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to fetch YouTube videos for an artist
async function getYouTubeVideos(artistName: string) {
    try {
        // This is a placeholder for the actual YouTube API call
        console.log('🔍 Fetching YouTube videos for:', artistName);

        // Example response structure
        return [
            {
                id: 'video1',
                title: 'Test Video 1',
                viewCount: 1000000,
                publishedAt: '2023-01-01T00:00:00Z',
            },
            {
                id: 'video2',
                title: 'Test Video 2',
                viewCount: 500000,
                publishedAt: '2023-02-01T00:00:00Z',
            },
        ];
    } catch (error) {
        console.error('Error fetching YouTube videos:', error);
        throw new Error(`Failed to fetch YouTube videos for ${artistName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Function to fetch Spotify tracks for an artist
async function getSpotifyTracks(spotifyId: string) {
    try {
        // This is a placeholder for the actual Spotify API call
        console.log('🔍 Fetching Spotify tracks for:', spotifyId);

        // Example response structure
        return [
            {
                id: 'track1',
                name: 'Test Track 1',
                popularity: 80,
                album: {
                    images: [{ url: 'https://example.com/album1.jpg' }],
                },
            },
            {
                id: 'track2',
                name: 'Test Track 2',
                popularity: 70,
                album: {
                    images: [{ url: 'https://example.com/album2.jpg' }],
                },
            },
        ];
    } catch (error) {
        console.error('Error fetching Spotify tracks:', error);
        throw new Error(`Failed to fetch Spotify tracks for ${spotifyId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

// Convert YouTube response to artist metrics format
function convertYouTubeResponseToArtistMetrics(data: any) {
    return [
        {
            platform: 'youtube',
            metric_type: 'subscribers',
            value: data.subscribers,
            date: new Date().toISOString(),
        },
        {
            platform: 'youtube',
            metric_type: 'views',
            value: data.totalViews,
            date: new Date().toISOString(),
        },
    ];
}

// Convert Spotify response to artist metrics format
function convertSpotifyResponseToArtistMetrics(data: any) {
    return [
        {
            platform: 'spotify',
            metric_type: 'followers',
            value: data.followers,
            date: new Date().toISOString(),
        },
        {
            platform: 'spotify',
            metric_type: 'popularity',
            value: data.popularity,
            date: new Date().toISOString(),
        },
    ];
}

// Convert Deezer response to artist metrics format
function convertDeezerResponseToArtistMetrics(data: any) {
    return [
        {
            platform: 'deezer',
            metric_type: 'followers',
            value: data.followers,
            date: new Date().toISOString(),
        },
        {
            platform: 'deezer',
            metric_type: 'albums',
            value: data.albums,
            date: new Date().toISOString(),
        },
    ];
}

// Convert YouTube videos to database format
function convertYouTubeVideosToDatabaseFormat(videos: any[]) {
    return videos.map(video => ({
        video_id: video.id,
        title: video.title,
        platform: 'youtube',
        view_count: video.viewCount,
        published_at: video.publishedAt,
    }));
}

// Convert Spotify tracks to database format
function convertSpotifyTracksToDatabaseFormat(tracks: any[]) {
    return tracks.map(track => ({
        track_id: track.id,
        title: track.name,
        platform: 'spotify',
        popularity: track.popularity,
        thumbnail_url: track.album.images[0].url,
    }));
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const spotifyId = searchParams.get('spotifyId');

        if (!spotifyId) {
            return NextResponse.json(
                { error: 'Spotify ID is required' },
                { status: 400 }
            );
        }

        // Step 1: Fetch Spotify artist metadata
        const spotifyMetadata = await getSpotifyArtistMetadata(spotifyId);
        const artistName = spotifyMetadata.name;

        // Step 2: Get all platform IDs upfront
        const platformIds = await getAllPlatformIds(artistName, spotifyId);

        // Step 3: Fetch analytics data from all sources in parallel
        const [youtubeData, spotifyData, deezerData] = await Promise.all([
            getYouTubeData(artistName),
            getSpotifyData(spotifyId),
            platformIds.deezer ? getDeezerData(platformIds.deezer) : Promise.resolve(null),
        ]);

        // Step 4: Convert analytics data to metrics format
        const youtubeMetrics = convertYouTubeResponseToArtistMetrics(youtubeData);
        const spotifyMetrics = convertSpotifyResponseToArtistMetrics(spotifyData);

        // Only add Deezer metrics if we have the data
        const allMetrics = [...youtubeMetrics, ...spotifyMetrics];
        if (deezerData) {
            allMetrics.push(...convertDeezerResponseToArtistMetrics(deezerData));
        }

        // Step 5: Fetch media data from both sources in parallel
        const [youtubeVideos, spotifyTracks] = await Promise.all([
            getYouTubeVideos(artistName),
            getSpotifyTracks(spotifyId),
        ]);

        // Step 6: Convert media data to database format
        const videos = convertYouTubeVideosToDatabaseFormat(youtubeVideos);
        const tracks = convertSpotifyTracksToDatabaseFormat(spotifyTracks);

        // Step 7: Prepare artist data for database
        const artistData = {
            name: spotifyMetadata.name,
            image_url: spotifyMetadata.images[0].url,
            genres: spotifyMetadata.genres,
            followers: spotifyMetadata.followers.total,
            is_complete: true,
        };

        // Step 8: Prepare platform IDs for database
        const platformIdsForDatabase = [
            {
                platform: 'spotify',
                platform_id: platformIds.spotify,
            },
            {
                platform: 'youtube',
                platform_id: artistName.toLowerCase().replace(/\s+/g, ''),
            },
        ];

        // Only add Deezer if we successfully got the ID
        if (platformIds.deezer) {
            platformIdsForDatabase.push({
                platform: 'deezer',
                platform_id: platformIds.deezer,
            });
        }

        // Return all the data that would be stored in the database
        return NextResponse.json({
            artist: artistData,
            platformIds: platformIdsForDatabase,
            metrics: allMetrics,
            videos,
            tracks,
        });
    } catch (error) {
        console.error('Error in artist addition test route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 