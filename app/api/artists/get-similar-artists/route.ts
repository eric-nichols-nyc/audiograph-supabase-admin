
import { ArtistSimilarityService } from "@/services/artist-similarity-service";

export const GET = async (
    request: Request
) => {
    console.log('Getting artists');
    // Get the ID from the URL query parameters
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
        return new Response(JSON.stringify({ success: false, message: 'Artist ID is required' }), { status: 400 });
    }
    // try catch call to action
    try {
        const service = new ArtistSimilarityService();
        const result = await service.getSimilarArtists(id);

        console.log('Loaded artists');
        console.log(result);

        return new Response(JSON.stringify({ success: true, data: result }), { status: 200 });
    } catch (error) {
        console.error('Error loading artists:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error loading artists' }), { status: 500 });
    }
};
