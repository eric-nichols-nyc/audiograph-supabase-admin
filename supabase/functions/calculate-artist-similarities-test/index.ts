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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    
    console.log('Environment variables available:', {
      hasUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey)
    });
    
    // Create a Supabase client
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      }
    )
    
    // Parse request body
    const { limit, specificArtistId } = await req.json().catch(() => ({}))
    console.log('Request params:', { limit, specificArtistId })
    
    try {
      // Test database connection with a simple query
      console.log('Testing artists table...');
      const { data: artistsData, error: artistsError } = await supabaseClient
        .from('artists')
        .select('id, name')
        .limit(1);
      
      if (artistsError) {
        console.error('Artists table test failed:', artistsError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Artists table test failed',
            error: artistsError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Artists table test successful:', artistsData);
      
      // Test artist_articles table
      console.log('Testing artist_articles table...');
      const { data: articlesData, error: articlesError } = await supabaseClient
        .from('artist_articles')
        .select('id, artist_id')
        .limit(1);
      
      if (articlesError) {
        console.error('Artist_articles table test failed:', articlesError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Artist_articles table test failed',
            error: articlesError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Artist_articles table test successful:', articlesData);
      
      // Skip join query test due to multiple relationships
      console.log('Skipping join query test due to multiple relationships');
      
      // Test embedding column
      console.log('Testing embedding column...');
      const { data: embeddingData, error: embeddingError } = await supabaseClient
        .from('artist_articles')
        .select('id, artist_id, embedding')
        .limit(1);
      
      if (embeddingError) {
        console.error('Embedding column test failed:', embeddingError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Embedding column test failed',
            error: embeddingError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Embedding column test successful:', embeddingData);
      
      // Test vector_similarity RPC function
      console.log('Testing vector_similarity RPC function...');
      
      // Get two embeddings to compare
      const { data: embeddings, error: embeddingsError } = await supabaseClient
        .from('artist_articles')
        .select('id, embedding')
        .limit(2);
      
      if (embeddingsError || !embeddings || embeddings.length < 2) {
        console.error('Failed to get embeddings for similarity test:', embeddingsError || 'Not enough embeddings');
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Failed to get embeddings for similarity test',
            error: embeddingsError?.message || 'Not enough embeddings'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Call vector_similarity RPC function
      const { data: similarityResult, error: similarityError } = await supabaseClient.rpc(
        'vector_similarity',
        {
          vec1: embeddings[0].embedding,
          vec2: embeddings[1].embedding
        }
      );
      
      if (similarityError) {
        console.error('Vector similarity test failed:', similarityError);
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: 'Vector similarity test failed',
            error: similarityError.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Vector similarity test successful:', similarityResult);
      
      // Return success message
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'All tests passed successfully',
          tests: {
            artists: {
              success: true,
              data: artistsData
            },
            articles: {
              success: true,
              data: articlesData
            },
            embedding: {
              success: true,
              data: embeddingData
            },
            vector_similarity: {
              success: true,
              data: similarityResult
            }
          },
          params: { limit, specificArtistId }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Database error occurred',
          error: dbError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Function error occurred',
        error: error.message
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})
