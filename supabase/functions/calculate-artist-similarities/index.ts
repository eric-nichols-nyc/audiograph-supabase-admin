import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )

    // Parse request body
    const { limit, specificArtistId } = await req.json().catch(() => ({}))

    // Get artists to process
    let artistsToProcess

    if (specificArtistId) {
      // Process just one artist if specified
      const { data, error } = await supabaseClient
        .from('artists')
        .select('id, name, genres')
        .eq('id', specificArtistId)

      if (error) {
        console.error('Error fetching specific artist:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      artistsToProcess = data
    } else {
      // Get artists that need processing, prioritizing those with few or outdated similarities
      const { data, error } = await supabaseClient
        .from('artists')
        .select('id, name, genres')
        .order('created_at', { ascending: false })
        .limit(limit || 10)

      if (error) {
        console.error('Error fetching artists:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      artistsToProcess = data
    }

    if (!artistsToProcess?.length) {
      return new Response(
        JSON.stringify({ success: true, message: 'No artists to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Process each source artist
    const results = []

    for (const sourceArtist of artistsToProcess) {
      // Get the source artist's article embedding
      const { data: sourceArticles, error: sourceArticleError } = await supabaseClient
        .from('artist_articles')
        .select('id, content, embedding')
        .eq('artist_id', sourceArtist.id)
        .limit(1)

      if (sourceArticleError) {
        console.error('Error fetching source artist article:', sourceArticleError);
        continue;
      }

      const sourceArticle = sourceArticles?.[0];

      // Get artists to compare with
      const { data: otherArtists, error } = await supabaseClient
        .from('artists')
        .select(`id,name,genres,metrics:artist_metrics(platform,metric_type,value,date)`)
        .neq('id', sourceArtist.id)
        .limit(100)

      if (error) {
        console.error('Error fetching other artists:', error);
        continue;
      }

      if (!otherArtists?.length) continue

      // Get source artist's metrics
      const { data: sourceMetrics, error: sourceMetricsError } = await supabaseClient
        .from('artist_metrics')
        .select('platform, metric_type, value, date')
        .eq('artist_id', sourceArtist.id)
        .order('date', { ascending: false })
        .limit(50)

      if (sourceMetricsError) {
        console.error('Error fetching source artist metrics:', sourceMetricsError);
      }

      // Calculate similarities and prepare for batch insert
      const similarities = []

      for (const targetArtist of otherArtists) {
        // Get target artist's metrics
        const { data: targetMetrics, error: targetMetricsError } = await supabaseClient
          .from('artist_metrics')
          .select('platform, metric_type, value, date')
          .eq('artist_id', targetArtist.id)
          .order('date', { ascending: false })
          .limit(50)

        if (targetMetricsError) {
          console.error('Error fetching target artist metrics:', targetMetricsError);
        }

        // Calculate similarity components
        const genreSimilarity = calculateGenreSimilarity(
          sourceArtist.genres || [],
          targetArtist.genres || []
        )

        const nameSimilarity = calculateNameSimilarity(
          sourceArtist.name,
          targetArtist.name
        )

        // Calculate metrics similarity
        const metricsSimilarity = calculateMetricsSimilarity(
          sourceMetrics || [],
          targetMetrics || []
        )

        // Calculate content similarity using embeddings if available
        let contentSimilarity = 0

        if (sourceArticle?.embedding) {
          // Get the target artist's article embedding
          const { data: targetArticles, error: targetArticleError } = await supabaseClient
            .from('artist_articles')
            .select('id, content, embedding')
            .eq('artist_id', targetArtist.id)
            .limit(1)

          if (!targetArticleError && targetArticles?.[0]?.embedding) {
            // Use the Supabase RPC function for vector similarity
            const { data: vectorSim, error: vectorError } = await supabaseClient.rpc('vector_similarity', {
              vec1: sourceArticle.embedding,
              vec2: targetArticles[0].embedding
            })

            if (vectorError) {
              console.error('Error calculating vector similarity:', vectorError);
            } else {
              contentSimilarity = vectorSim || 0
            }
          }
        }

        // Apply weights to the components
        const weights = {
          genre: 0.35,
          name: 0.05,
          content: 0.20,
          metrics: 0.40
        }

        const similarityScore = (
          (genreSimilarity * weights.genre) +
          (nameSimilarity * weights.name) +
          (contentSimilarity * weights.content) +
          (metricsSimilarity * weights.metrics)
        )

        // Add to batch with detailed metadata
        similarities.push({
          artist1_id: sourceArtist.id,
          artist2_id: targetArtist.id,
          similarity_score: similarityScore,
          last_updated: new Date().toISOString(),
          metadata: {
            factors: {
              genre_similarity: genreSimilarity,
              name_similarity: nameSimilarity,
              content_similarity: contentSimilarity,
              metrics_similarity: metricsSimilarity
            }
          }
        })
      }

      // Upsert similarities to database in batches (to avoid hitting Supabase limits)
      if (similarities.length > 0) {
        // Process in batches of 50
        const batchSize = 50
        for (let i = 0; i < similarities.length; i += batchSize) {
          const batch = similarities.slice(i, i + batchSize)

          const { error: upsertError } = await supabaseClient
            .from('similar_artists')
            .upsert(batch, {
              onConflict: 'artist1_id,artist2_id',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error('Error upserting similarities:', upsertError);
            continue;
          }
        }

        results.push({
          artist_id: sourceArtist.id,
          artist_name: sourceArtist.name,
          similarities_calculated: similarities.length
        })
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results,
        total_artists_processed: results.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Helper functions for similarity calculations
function calculateGenreSimilarity(genres1: string[], genres2: string[]): number {
  if (!genres1?.length || !genres2?.length) return 0

  const set1 = new Set(genres1)
  const set2 = new Set(genres2)

  const intersection = [...set1].filter(genre => set2.has(genre))
  const union = new Set([...genres1, ...genres2])

  return intersection.length / union.size
}

function calculateMetricsSimilarity(metrics1: any[], metrics2: any[]): number {
  if (!metrics1?.length || !metrics2?.length) return 0

  const getLatestMetricValue = (metrics: any[], platform: string, type: string) => {
    const metric = metrics.find(m => m.platform === platform && m.metric_type === type);
    return metric ? parseFloat(metric.value) : 0;
  }

  // Get latest metrics for each platform
  const spotify1 = getLatestMetricValue(metrics1, 'spotify', 'followers');
  const spotify2 = getLatestMetricValue(metrics2, 'spotify', 'followers');
  const youtube1 = getLatestMetricValue(metrics1, 'youtube', 'subscribers');
  const youtube2 = getLatestMetricValue(metrics2, 'youtube', 'subscribers');
  const genius1 = getLatestMetricValue(metrics1, 'genius', 'followers');
  const genius2 = getLatestMetricValue(metrics2, 'genius', 'followers');

  // Calculate relative differences using logarithmic scale
  const calculateRelativeSimilarity = (val1: number, val2: number) => {
    if (val1 === 0 && val2 === 0) return 1;
    if (val1 === 0 || val2 === 0) return 0;
    const log1 = Math.log10(val1);
    const log2 = Math.log10(val2);
    const diff = Math.abs(log1 - log2);
    // Scale difference to 0-1 range, with closer numbers having higher similarity
    return Math.max(0, 1 - (diff / 3)); // Divide by 3 to make the scaling less aggressive
  }

  const spotifySimilarity = calculateRelativeSimilarity(spotify1, spotify2);
  const youtubeSimilarity = calculateRelativeSimilarity(youtube1, youtube2);
  const geniusSimilarity = calculateRelativeSimilarity(genius1, genius2);

  // Weight the platform similarities
  const platformWeights = {
    spotify: 0.5,     // Spotify is most important for music
    youtube: 0.4,     // YouTube second most important
    genius: 0.1       // Genius least important but still useful
  }

  return (
    (spotifySimilarity * platformWeights.spotify) +
    (youtubeSimilarity * platformWeights.youtube) +
    (geniusSimilarity * platformWeights.genius)
  );
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const normalizedName1 = name1.toLowerCase()
  const normalizedName2 = name2.toLowerCase()

  if (normalizedName1 === normalizedName2) return 1

  // Calculate word overlap
  const words1 = new Set(normalizedName1.split(/\s+/))
  const words2 = new Set(normalizedName2.split(/\s+/))
  const intersection = [...words1].filter(word => words2.has(word))

  if (intersection.length > 0) {
    return 0.8 * (intersection.length / Math.max(words1.size, words2.size))
  }

  // Check for substring matches
  if (normalizedName1.includes(normalizedName2) || normalizedName2.includes(normalizedName1)) {
    return 0.6
  }

  // Calculate Levenshtein-based similarity for remaining cases
  const maxLength = Math.max(normalizedName1.length, normalizedName2.length)
  const distance = levenshteinDistance(normalizedName1, normalizedName2)
  return Math.max(0, 1 - (distance / maxLength))
}

function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1
        )
      }
    }
  }

  return dp[m][n]
}
