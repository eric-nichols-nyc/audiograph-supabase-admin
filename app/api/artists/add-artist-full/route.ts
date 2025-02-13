import { addArtistFullSchema } from "@/schemas/addArtistFullSchema";
import { addArtistFull } from "@/services/addArtistFull";


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