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
        // You'll need to implement the actual API call to YouTube
        console.log('🔍 Fetching YouTube data for:', artistName);

        // Example response structure
        // In a real implementation, you would call the YouTube API here
        return {
            subscribers: 1000000,
            totalViews: 50000000,
            // Add other YouTube metrics as needed
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
        // You'll need to implement the actual API call to Spotify
        console.log('🔍 Fetching Spotify data for:', spotifyId);

        // Example response structure
        // In a real implementation, you would call the Spotify API here
        return {
            followers: 5000000,
            popularity: 85,
            // Add other Spotify metrics as needed
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

// Convert combined response to artist metrics format
function convertCombinedResponseToArtistMetrics(youtubeData: any, spotifyData: any, deezerData: any | null) {
    const metrics = [
        // YouTube metrics
        {
            platform: 'youtube',
            metric_type: 'subscribers',
            value: youtubeData.subscribers,
            date: new Date().toISOString(),
        },
        {
            platform: 'youtube',
            metric_type: 'views',
            value: youtubeData.totalViews,
            date: new Date().toISOString(),
        },
        // Spotify metrics
        {
            platform: 'spotify',
            metric_type: 'followers',
            value: spotifyData.followers,
            date: new Date().toISOString(),
        },
        {
            platform: 'spotify',
            metric_type: 'popularity',
            value: spotifyData.popularity,
            date: new Date().toISOString(),
        },
    ];

    // Add Deezer metrics if available
    if (deezerData) {
        metrics.push(
            {
                platform: 'deezer',
                metric_type: 'followers',
                value: deezerData.followers,
                date: new Date().toISOString(),
            },
            {
                platform: 'deezer',
                metric_type: 'albums',
                value: deezerData.albums,
                date: new Date().toISOString(),
            }
        );
    }

    return metrics;
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const artistName = searchParams.get('artistName');
        const spotifyId = searchParams.get('spotifyId');

        if (!artistName || !spotifyId) {
            return NextResponse.json(
                { error: 'Both artist name and Spotify ID are required' },
                { status: 400 }
            );
        }

        // Get all platform IDs upfront
        const platformIds = await getAllPlatformIds(artistName, spotifyId);

        // Fetch data from all sources in parallel
        const [youtubeData, spotifyData, deezerData] = await Promise.all([
            getYouTubeData(artistName),
            getSpotifyData(spotifyId),
            platformIds.deezer ? getDeezerData(platformIds.deezer) : Promise.resolve(null),
        ]);

        // Combine the data
        const metrics = convertCombinedResponseToArtistMetrics(youtubeData, spotifyData, deezerData);

        // Prepare platform IDs for response
        const platformIdsForResponse = [
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
            platformIdsForResponse.push({
                platform: 'deezer',
                platform_id: platformIds.deezer,
            });
        }

        return NextResponse.json({
            raw: {
                youtube: youtubeData,
                spotify: spotifyData,
                deezer: deezerData,
            },
            metrics,
            platformIds: platformIdsForResponse,
        });
    } catch (error) {
        console.error('Error in combined analytics route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 