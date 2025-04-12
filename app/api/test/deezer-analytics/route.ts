import { NextResponse } from 'next/server';
import { DeezerService } from '@/services/deezer-service';

// Function to fetch Deezer data for an artist
async function getDeezerData(artistName: string) {
    try {
        // Use the DeezerService to fetch artist data by ID
        console.log('🔍 Fetching Deezer data for ID:', artistName);

        const deezerArtist = await DeezerService.getArtist(artistName);

        if (!deezerArtist) {
            throw new Error(`Artist not found on Deezer with ID: ${artistName}`);
        }

        // Extract the relevant data - note that properties are directly on deezerArtist, not nested under 'artist'
        return {
            followers: deezerArtist.nb_fan,
            albums: deezerArtist.nb_album,
            // Add other Deezer metrics as needed
        };
    } catch (error) {
        console.error('Error fetching Deezer data:', error);
        throw new Error(`Failed to fetch Deezer data for ${artistName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
        // Add other metrics as needed
    ];
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const artistName = searchParams.get('artistName');

        if (!artistName) {
            return NextResponse.json(
                { error: 'Artist name is required' },
                { status: 400 }
            );
        }

        const deezerData = await getDeezerData(artistName);
        const metrics = convertDeezerResponseToArtistMetrics(deezerData);

        return NextResponse.json({
            raw: deezerData,
            metrics,
        });
    } catch (error) {
        console.error('Error in Deezer analytics route:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
} 