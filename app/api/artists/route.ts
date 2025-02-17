import { getArtistData } from "@/actions/artist";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }
  const artist = await getArtistData(slug);
  return NextResponse.json(artist);
}
