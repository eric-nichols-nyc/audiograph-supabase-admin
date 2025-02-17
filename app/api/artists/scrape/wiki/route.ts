import { scrapeAndStoreWikipedia } from "@/services/wikipedia-service";



// // API route entry point
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const artistName = searchParams.get('artistName');
    
    if (!artistId || !artistName) {
      return new Response(
        JSON.stringify({ error: 'Artist ID and artist name are required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await scrapeAndStoreWikipedia(artistName, artistId);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}