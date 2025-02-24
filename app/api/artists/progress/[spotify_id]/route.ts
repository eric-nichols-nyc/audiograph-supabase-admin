import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'
import { ProgressUpdate } from '@/types/progress'

// Create Redis client for storing processing status
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Helper to send updates that can be called from batch-artist-full
export async function sendArtistUpdate(spotify_id: string, update: ProgressUpdate) {
  const key = `artist:progress:${spotify_id}`
  // Stringify the update before storing
  const stringifiedUpdate = JSON.stringify(update)
  await redis.set(key, stringifiedUpdate)
  
  // Automatically cleanup after completion or error
  if (update.stage === 'COMPLETE' || update.stage === 'ERROR') {
    await redis.expire(key, 300)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { spotify_id: string } }
) {
  const spotify_id = params.spotify_id
  console.log('Progress request for:', spotify_id);

  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }

  const stream = new ReadableStream({
    async start(controller) {
      const key = `artist:progress:${spotify_id}`
      
      try {
        // Check initial status
        const lastUpdate = await redis.get(key)
        console.log('Initial status:', lastUpdate);
        
        if (lastUpdate) {
          controller.enqueue(`data: ${lastUpdate}\n\n`)
        }

        // Poll for updates
        const interval = setInterval(async () => {
          try {
            const update = await redis.get(key)
            console.log('Update received:', update);
            
            if (!update) {
              const initialStatus = {
                stage: 'INIT',
                message: 'Initializing...',
                details: 'Waiting for process to start',
                progress: 0
              };
              controller.enqueue(`data: ${JSON.stringify(initialStatus)}\n\n`)
              return
            }

            // Only send if different from lastUpdate and ensure it's a string
            if (update !== lastUpdate) {
              const updateString = typeof update === 'string' 
                ? update 
                : JSON.stringify(update);
              
              controller.enqueue(`data: ${updateString}\n\n`)
            }

            // Check for completion
            const status = typeof update === 'string' 
              ? JSON.parse(update) 
              : update;
            
            if (status.stage === 'COMPLETE' || status.stage === 'ERROR') {
              clearInterval(interval);
              controller.close();
            }

          } catch (error) {
            console.error('Polling error:', error);
            controller.enqueue(`data: ${JSON.stringify({
              stage: 'ERROR',
              message: 'Connection Error',
              details: error instanceof Error ? error.message : 'Failed to get updates',
              progress: 0
            })}\n\n`);
          }
        }, 1000);

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          console.log('Client disconnected:', spotify_id);
          clearInterval(interval);
        });

      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(`data: ${JSON.stringify({
          stage: 'ERROR',
          message: 'Connection Error',
          details: error instanceof Error ? error.message : 'Failed to start progress tracking',
          progress: 0
        })}\n\n`);
        controller.close();
      }
    }
  });

  return new Response(stream, { headers });
}