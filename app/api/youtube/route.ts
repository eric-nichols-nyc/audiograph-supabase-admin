import { createYoutubeService } from "@/services/youtube-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get('channelId');
  if (!channelId) {
    return Response.json({ error: 'Channel ID is required' }, { status: 400 });
  }

  const youtubeService = createYoutubeService();
  const result = await youtubeService.getArtistYoutubeInfoByChannelId(channelId);
  return Response.json(result);
}
