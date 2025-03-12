async function searchDeezerArtist(artistName: string) {
  const response = await fetch(`https://api.deezer.com/search?q=${artistName}&limit=1&type=artist`);
  const data = await response.json();
  return data.data[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get('artistName');
  if (!artistName) {
    return new Response('Artist name is required', { status: 400 });
  }
  const artist = await searchDeezerArtist(artistName);
  return Response.json(artist);
}
