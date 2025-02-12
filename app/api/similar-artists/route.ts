import { ArtistService } from '@/services/artistService';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistId = searchParams.get('artistId');
  if (!artistId) {
    return new Response(JSON.stringify({ error: 'Artist ID required' }), { status: 400 });
  }
  try {
    const service = new ArtistService();
    const similarArtists = await service.getSimilarArtists(artistId);
    return new Response(JSON.stringify(similarArtists), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
      { status: 500 }
    );
  }
} 