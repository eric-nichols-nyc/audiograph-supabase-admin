import { ArtistSimilarityCalculationService } from "@/services/artist-similarity-calculation-service";
import { unstable_cache } from 'next/cache';

// Cache the similarity calculation results
const getCachedSimilarArtists = (artistId: string) => unstable_cache(
    async () => {
        console.log(`[Cache Miss] Fetching fresh similar artists data for artist: ${artistId}`);
        const calculationService = new ArtistSimilarityCalculationService();
        const result = await calculationService.getSimilarArtists(artistId);
        return result;
    },
    ['similar-artists', `artist-${artistId}`], // cache tags for revalidation
    {
        revalidate: 86400 // Cache for 24 hours
    }
)();

export const POST = async (
    request: Request,
    { params }: { params: { id: string } }
) => {
    const artistId = params.id;

    if (!artistId) {
        return new Response(
            JSON.stringify({ success: false, message: 'Artist ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Generating similarities for artist: ${artistId}`);

    try {
        // Use the new calculation service to trigger the Edge Function
        const calculationService = new ArtistSimilarityCalculationService();
        const result = await calculationService.calculateSimilaritiesForArtist(artistId);

        if (!result.success) {
            return new Response(
                JSON.stringify({
                    success: false,
                    message: result.error || 'Error calculating similarities'
                }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get the newly calculated similar artists using the cached function
        const similarArtists = await getCachedSimilarArtists(artistId);

        return new Response(
            JSON.stringify({
                success: true,
                calculation_result: result,
                similar_artists: similarArtists
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=86400, s-maxage=86400, stale-while-revalidate=43200'
                }
            }
        );
    } catch (error) {
        console.error('Error generating similar artists:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};

// Keep the GET method for backward compatibility
export const GET = async (
    request: Request,
    { params }: { params: { id: string } }
) => {
    const artistId = params.id;

    if (!artistId) {
        return new Response(
            JSON.stringify({ success: false, message: 'Artist ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    console.log(`Getting similar artists for: ${artistId}`);

    try {
        // Use the cached function to get similar artists
        const similarArtists = await getCachedSimilarArtists(artistId);

        return new Response(
            JSON.stringify({
                success: true,
                data: similarArtists
            }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=86400, s-maxage=86400, stale-while-revalidate=43200'
                }
            }
        );
    } catch (error) {
        console.error('Error getting similar artists:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
