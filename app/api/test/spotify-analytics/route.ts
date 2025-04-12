import { NextResponse } from 'next/server';

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
        // Add other metrics as needed
    ];
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

        const spotifyData = await getSpotifyData(spotifyId);
        const metrics = convertSpotifyResponseToArtistMetrics(spotifyData);

        return NextResponse.json({
            raw: spotifyData,
            metrics,
        });
    } catch (error) {
        console.error('Error in Spotify analytics route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 