import { ArtistSimilarityCalculationService } from "@/services/artist-similarity-calculation-service";

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

        // Get the newly calculated similar artists
        const similarArtists = await calculationService.getSimilarArtists(artistId);

        return new Response(
            JSON.stringify({
                success: true,
                calculation_result: result,
                similar_artists: similarArtists
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
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
        // Use the new calculation service to get similar artists
        const calculationService = new ArtistSimilarityCalculationService();
        const similarArtists = await calculationService.getSimilarArtists(artistId);

        return new Response(
            JSON.stringify({
                success: true,
                data: similarArtists
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
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
