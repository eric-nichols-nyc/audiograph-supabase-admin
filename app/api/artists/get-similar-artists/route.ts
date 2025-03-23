import { ArtistSimilarityCalculationService } from "@/services/artist-similarity-calculation-service";

export const GET = async (
    request: Request
) => {
    console.log('Getting similar artists');
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(
            JSON.stringify({ success: false, message: 'Artist ID is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    try {
        const service = ArtistSimilarityCalculationService.forRouteHandler();

        // Always try to calculate similarities first
        try {
            await service.calculateSimilaritiesForArtist(id);
        } catch (calcError) {
            console.log('Calculation failed or already exists, proceeding to fetch existing similarities');
        }

        // Get whatever similar artists exist
        const similarArtists = await service.getSimilarArtists(id);
        console.log(`Loaded ${similarArtists.length} similar artists`);

        return new Response(
            JSON.stringify({ success: true, data: similarArtists }),
            {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'max-age=3600, s-maxage=3600, stale-while-revalidate=1800'
                }
            }
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
