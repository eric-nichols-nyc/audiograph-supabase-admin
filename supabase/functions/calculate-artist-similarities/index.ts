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

      // Get other artists to compare with
      const { data: otherArtists, error } = await supabaseClient
        .from('artists')
        .select('id, name, genres')
        .neq('id', sourceArtist.id)
        .limit(100) // Limit comparison to avoid processing too many

      if (error) {
        console.error('Error fetching other artists:', error);
        continue;
      }

      if (!otherArtists?.length) continue

      // Calculate similarities and prepare for batch insert
      const similarities = []

      for (const targetArtist of otherArtists) {
        // Calculate similarity components
        const genreSimilarity = calculateGenreSimilarity(
          sourceArtist.genres || [],
          targetArtist.genres || []
        )

        const nameSimilarity = calculateNameSimilarity(
          sourceArtist.name,
          targetArtist.name
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

        // Apply weights to the components (adjust as needed)
        const weights = {
          genre: 0.6,
          name: 0.1,
          content: 0.3
        }

        const similarityScore = (
          (genreSimilarity * weights.genre) +
          (nameSimilarity * weights.name) +
          (contentSimilarity * weights.content)
        )

        // Add to batch
        similarities.push({
          artist1_id: sourceArtist.id,
          artist2_id: targetArtist.id,
          similarity_score: similarityScore,
          last_updated: new Date().toISOString(),
          metadata: {
            factors: {
              genre_similarity: genreSimilarity,
              name_similarity: nameSimilarity,
              content_similarity: contentSimilarity
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

function calculateNameSimilarity(name1: string, name2: string): number {
  // Simple implementation - you can replace with your full Levenshtein implementation
  const normalizedName1 = name1.toLowerCase()
  const normalizedName2 = name2.toLowerCase()

  if (normalizedName1 === normalizedName2) return 1
  if (normalizedName1.includes(normalizedName2) || normalizedName2.includes(normalizedName1)) return 0.8

  // More advanced logic can be implemented here
  return 0.1
}
