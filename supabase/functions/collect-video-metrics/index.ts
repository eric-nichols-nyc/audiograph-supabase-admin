// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

const BATCH_SIZE = 50 // Process 50 videos per batch

interface VideoMetrics {
  views: { date: string; count: number }[]
  likes: { date: string; count: number }[]
  comments: { date: string; count: number }[]
}

function calculateTrendIndicator(metrics: { date: string; count: number }[]): 'up' | 'down' | 'stable' {
  if (metrics.length < 2) return 'stable'
  
  const latest = metrics[metrics.length - 1].count
  const previous = metrics[metrics.length - 2].count
  const percentChange = ((latest - previous) / previous) * 100
  
  if (percentChange > 5) return 'up'
  if (percentChange < -5) return 'down'
  return 'stable'
}

async function fetchYouTubeStatsInBatch(videoIds: string[]) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`
  )
  const data = await response.json()
  
  if (!data.items) {
    throw new Error('No data found for videos')
  }
  
  // Create a map of video ID to statistics
  return data.items.reduce((acc: Record<string, any>, item: any) => {
    acc[item.id] = item.statistics
    return acc
  }, {})
}

async function processVideoBatch(supabase: any, batchNumber: number, currentDate: string) {
  // Get videos for this batch
  const { data: videos, error: fetchError } = await supabase
    .from('videos')
    .select('id, video_id, historical_metrics')
    .range(batchNumber * BATCH_SIZE, (batchNumber + 1) * BATCH_SIZE - 1)
  
  if (fetchError) throw fetchError
  if (!videos || videos.length === 0) {
    return { processed: 0, hasMore: false }
  }

  // Filter out videos without video IDs (extra safety check)
  const validVideos = videos.filter(v => v.video_id?.trim())
  const videoIds = validVideos.map(v => v.video_id)
  
  if (videoIds.length === 0) {
    return { processed: 0, hasMore: videos.length === BATCH_SIZE }
  }

  // Fetch stats for all videos in batch
  const statsMap = await fetchYouTubeStatsInBatch(videoIds)
  
  // Process each video
  const updates = await Promise.all(validVideos.map(async (video) => {
    const stats = statsMap[video.video_id]
    if (!stats) {
      console.log(`No YouTube stats found for video ID: ${video.video_id}`)
      return null
    }
    
    // Initialize or update historical metrics
    let historicalMetrics: VideoMetrics = video.historical_metrics || {
      views: [],
      likes: [],
      comments: []
    }

    // Add new metrics
    historicalMetrics.views.push({ date: currentDate, count: parseInt(stats.viewCount) })
    historicalMetrics.likes.push({ date: currentDate, count: parseInt(stats.likeCount) })
    historicalMetrics.comments.push({ date: currentDate, count: parseInt(stats.commentCount) })

    // Keep only last 30 days of metrics
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0]

    historicalMetrics.views = historicalMetrics.views.filter(m => m.date >= thirtyDaysAgoStr)
    historicalMetrics.likes = historicalMetrics.likes.filter(m => m.date >= thirtyDaysAgoStr)
    historicalMetrics.comments = historicalMetrics.comments.filter(m => m.date >= thirtyDaysAgoStr)

    // Calculate trend indicators
    const trendIndicator = {
      views: calculateTrendIndicator(historicalMetrics.views),
      likes: calculateTrendIndicator(historicalMetrics.likes),
      comments: calculateTrendIndicator(historicalMetrics.comments)
    }

    return {
      id: video.id,
      historical_metrics: historicalMetrics,
      trend_indicator: trendIndicator,
      metrics_last_updated: new Date().toISOString()
    }
  }))

  // Filter out null updates and update the database
  const validUpdates = updates.filter(Boolean)
  if (validUpdates.length > 0) {
    for (const update of validUpdates) {
      const { error: updateError } = await supabase
        .from('videos')
        .update({
          historical_metrics: update.historical_metrics,
          trend_indicator: update.trend_indicator,
          metrics_last_updated: update.metrics_last_updated
        })
        .eq('id', update.id)

      if (updateError) throw updateError
    }
  }

  return {
    processed: validUpdates.length,
    hasMore: videos.length === BATCH_SIZE,
    skipped: videos.length - validUpdates.length
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const currentDate = new Date().toISOString().split('T')[0]
    
    let batchNumber = 0
    let totalProcessed = 0
    let totalSkipped = 0
    let hasMore = true
    const results = []

    // Process all batches sequentially
    while (hasMore) {
      const result = await processVideoBatch(supabase, batchNumber, currentDate)
      totalProcessed += result.processed
      totalSkipped += result.skipped || 0
      hasMore = result.hasMore
      results.push({ 
        batch: batchNumber, 
        processed: result.processed,
        skipped: result.skipped || 0
      })
      batchNumber++
      
      // Add a small delay between batches to avoid rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    return new Response(JSON.stringify({
      success: true,
      totalProcessed,
      totalSkipped,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/collect-video-metrics' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
