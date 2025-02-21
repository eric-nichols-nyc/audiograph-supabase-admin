import { NextResponse } from 'next/server';

// Create a Map to store progress updates for each artist
const progressUpdates = new Map<string, TransformStream>();

// Function to get or create a stream for an artist
export function getArtistStream(artistId: string) {
  if (!progressUpdates.has(artistId)) {
    const stream = new TransformStream();
    progressUpdates.set(artistId, stream);
  }
  return progressUpdates.get(artistId)!;
}

// Function to send an update to an artist's stream
export async function sendArtistUpdate(artistId: string, data: any) {
  const stream = progressUpdates.get(artistId);
  if (stream) {
    const writer = stream.writable.getWriter();
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    await writer.close();
  }
}

export async function GET(
  req: Request,
  { params }: { params: { artistId: string } }
) {
  const artistId = params.artistId;
  
  if (!artistId) {
    return new Response('Artist ID is required', { status: 400 });
  }

  const stream = getArtistStream(artistId);

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
} 