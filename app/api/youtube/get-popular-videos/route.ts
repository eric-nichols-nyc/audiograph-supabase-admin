import { createYoutubeService } from "@/services/youtube-service";

export async function GET(request: Request) {
    console.log('📥 Received request for popular videos');

    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query) {
            console.warn('❌ Missing required query parameter');
            return Response.json({ error: 'Search query is required' }, { status: 400 });
        }

        console.log(`🔍 Searching for popular videos with query: "${query}"`);

        // Optional parameter for maximum results, default to 20
        const maxResultsParam = searchParams.get('maxResults');
        const maxResults = maxResultsParam ? parseInt(maxResultsParam) : 20;
        console.log(`📊 Max results: ${maxResults}`);

        // Optional parameter for minimum views filter
        const minViewsParam = searchParams.get('minViews');
        const minViews = minViewsParam ? parseInt(minViewsParam) : 0;
        console.log(`👁️ Min views filter: ${minViews}`);

        const youtubeService = createYoutubeService();
        console.log('🔄 Fetching popular videos from YouTube API...');

        const result = await youtubeService.getPopularVideos(query, maxResults, minViews);

        console.log(`✅ Successfully retrieved ${result.total} videos for query "${query}"`);

        return Response.json(result);
    } catch (error) {
        console.error('❌ Error fetching popular videos:', error);

        // Determine if it's an API quota error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isQuotaError = errorMessage.includes('quota') || errorMessage.includes('quotaExceeded');

        if (isQuotaError) {
            return Response.json({
                error: 'YouTube API quota exceeded. Please try again later.',
                details: errorMessage
            }, { status: 429 });
        }

        return Response.json({
            error: 'Failed to fetch popular videos',
            details: errorMessage
        }, { status: 500 });
    }
} 