import { ArtistGeoListening } from "@/types/geo";

export const GET = async (request: Request) => {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');

    if (!artistId) {
        return new Response(
            JSON.stringify({ success: false, message: 'Artist ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const geoData = await getArtistById(artistId);
        return new Response(
            JSON.stringify({ success: true, data: geoData }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=3600, s-maxage=3600' // Cache for 1 hour
                }
            }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({ success: false, message: 'Error fetching artist' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}

async function getArtistById(artistId: string): Promise<ArtistGeoListening[]> {
    // Mock data simulating geographic listening data for an artist
    const mockGeoListening: ArtistGeoListening[] = [
        {
            id: "1",
            artist_id: artistId,
            city_id: "NYC123",
            listener_count: 50000,
            date: new Date("2024-01-15")
        },
        {
            id: "2",
            artist_id: artistId,
            city_id: "LON456",
            listener_count: 45000,
            date: new Date("2024-01-15")
        },
        {
            id: "3",
            artist_id: artistId,
            city_id: "TKY789",
            listener_count: 42000,
            date: new Date("2024-01-15")
        },
        {
            id: "4",
            artist_id: artistId,
            city_id: "PAR012",
            listener_count: 38000,
            date: new Date("2024-01-15")
        },
        {
            id: "5",
            artist_id: artistId,
            city_id: "BER345",
            listener_count: 35000,
            date: new Date("2024-01-15")
        },
        {
            id: "6",
            artist_id: artistId,
            city_id: "LAX678",
            listener_count: 32000,
            date: new Date("2024-01-15")
        },
        {
            id: "7",
            artist_id: artistId,
            city_id: "SYD901",
            listener_count: 28000,
            date: new Date("2024-01-15")
        },
        {
            id: "8",
            artist_id: artistId,
            city_id: "TOR234",
            listener_count: 25000,
            date: new Date("2024-01-15")
        },
        {
            id: "9",
            artist_id: artistId,
            city_id: "MEX567",
            listener_count: 22000,
            date: new Date("2024-01-15")
        },
        {
            id: "10",
            artist_id: artistId,
            city_id: "RIO890",
            listener_count: 20000,
            date: new Date("2024-01-15")
        }
    ];

    return mockGeoListening; // Return all mock data
}