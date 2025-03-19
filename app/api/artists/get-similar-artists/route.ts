import { ArtistSimilarityCalculationService } from "@/services/artist-similarity-calculation-service";

export const GET = async (
    request: Request
) => {
    console.log('Getting similar artists');
    // Get the ID from the URL query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(
            JSON.stringify({ success: false, message: 'Artist ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const service = new ArtistSimilarityCalculationService();

        // Check if similarities exist for this artist
        const hasSimilarities = await service.hasSimilarities(id);

        // If no similarities exist, calculate them first
        if (!hasSimilarities) {
            console.log(`No similarities found for artist ${id}, calculating now...`);
            const calculationResult = await service.calculateSimilaritiesForArtist(id);

            if (!calculationResult.success) {
                return new Response(
                    JSON.stringify({
                        success: false,
                        message: calculationResult.error || 'Error calculating similarities'
                    }),
                    { status: 500, headers: { 'Content-Type': 'application/json' } }
                );
            }

            console.log('Similarities calculated successfully');
        }

        // Get the similar artists
        const similarArtists = await service.getSimilarArtists(id);

        console.log(`Loaded ${similarArtists.length} similar artists`);

        return new Response(
            JSON.stringify({ success: true, data: similarArtists }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error loading similar artists:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Error loading similar artists'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
