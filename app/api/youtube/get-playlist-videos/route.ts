import { createYoutubeService } from "@/services/youtube-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');

    if (!playlistId) {
        return Response.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    // Optional parameter for maximum results
    const maxResultsParam = searchParams.get('maxResults');
    const maxResults = maxResultsParam ? parseInt(maxResultsParam) : 50;

    // Optional parameter for sorting
    const sortBy = searchParams.get('sortBy') === 'views' ? 'views' : 'date';

    // Optional parameter for minimum views filter
    const minViewsParam = searchParams.get('minViews');
    const minViews = minViewsParam ? parseInt(minViewsParam) : 0;

    const youtubeService = createYoutubeService();
    const result = await youtubeService.getPlaylistVideos(playlistId, maxResults, sortBy, minViews);

    return Response.json(result);
} 