import { scrapeKworbData } from '@/services/kworb-service';

//export const unstable_cache = 'force-cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get('artist');
  if (!artist) {
    return new Response(
      JSON.stringify({
        message: 'Artist parameter missing. Please provide an artist parameter like ?artist=justinbieber',
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const result = await scrapeKworbData(artist, 'videos');
    //console.log('*********result*******', result)
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store' // disable caching
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: 'Scraping failed',
        error: error instanceof Error ? error.toString() : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 