import { NextRequest } from 'next/server'
import { Redis } from '@upstash/redis'

// Create Redis client for storing processing status
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Type for progress updates
export interface ProgressUpdate {
  stage: 'INIT' | 'METADATA' | 'ANALYTICS' | 'MEDIA' | 'STORE' | 'COMPLETE' | 'ERROR';
  message: string;
  details: string;
  progress: number;
  payload?: any;
}

// Helper to send updates that can be called from batch-artist-full
export async function sendArtistUpdate(spotify_id: string, update: ProgressUpdate) {
  const key = `artist:progress:${spotify_id}`
  await redis.set(key, JSON.stringify(update))
  
  // Automatically cleanup after completion or error
  if (update.stage === 'COMPLETE' || update.stage === 'ERROR') {
    // Keep the status for 5 minutes after completion
    await redis.expire(key, 300)
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { spotify_id: string } }
) {
  const spotify_id = params.spotify_id

  // Set headers for SSE
  const headers = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  }

  // Create a readable stream
  const stream = new ReadableStream({
    async start(controller) {
      const key = `artist:progress:${spotify_id}`
      
      // Check initial status
      let lastUpdate = await redis.get<string>(key)
      if (lastUpdate) {
        controller.enqueue(`data: ${lastUpdate}\n\n`)
      }

      // Poll for updates
      const interval = setInterval(async () => {
        try {
          const update = await redis.get<string>(key)
          
          if (!update) {
            return // No update yet
          }

          // Only send if different from last update
          if (update !== lastUpdate) {
            controller.enqueue(`data: ${update}\n\n`)
            lastUpdate = update
          }

          // Parse update to check completion
          const status: ProgressUpdate = JSON.parse(update)
          if (status.stage === 'COMPLETE' || status.stage === 'ERROR') {
            clearInterval(interval)
            controller.close()
          }

        } catch (error) {
          console.error('Error polling for updates:', error)
          controller.error(error)
          clearInterval(interval)
        }
      }, 1000)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
      })
    }
  })

  return new Response(stream, { headers })
} 