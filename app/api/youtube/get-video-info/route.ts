import { createYoutubeService } from "@/services/youtube-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');
  if (!videoId) {
    return Response.json({ error: 'Video ID is required' }, { status: 400 });
  }

  const youtubeService = createYoutubeService();
  const result = await youtubeService.getVideoInfo(videoId);
  return Response.json(result);
}
