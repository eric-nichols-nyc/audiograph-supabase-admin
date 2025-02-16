import { addArtistFullSchema } from "@/schemas/artist-full-schema";
import { addArtistFull } from "@/services/add-artist-full";


export async function POST(request: Request) {
  const body = await request.json();
  const artistInfo = addArtistFullSchema.safeParse(body);
  if (!artistInfo.success) {
    console.error(artistInfo.error);
    return new Response(JSON.stringify(artistInfo.error), { status: 400 });
  }

  const { artist, platformData, urlData, metricData, tracks, videos } = artistInfo.data;

  const artistData = await addArtistFull(artistInfo.data);

  return new Response(JSON.stringify(artistData), { status: 200 });
}