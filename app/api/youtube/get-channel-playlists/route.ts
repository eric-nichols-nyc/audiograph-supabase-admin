import { createYoutubeService } from "@/services/youtube-service";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const channelId = searchParams.get('channelId');

    if (!channelId) {
        return Response.json({ error: 'Channel ID is required' }, { status: 400 });
    }

    // Optional parameter for maximum results
    const maxResultsParam = searchParams.get('maxResults');
    const maxResults = maxResultsParam ? parseInt(maxResultsParam) : 50;

    const youtubeService = createYoutubeService();
    const result = await youtubeService.getChannelPlaylists(channelId, maxResults);

    return Response.json(result);
} 