/**
 * Test Script for Artist Similarity Calculation Service
 * 
 * This script tests the new artist similarity calculation service by:
 * 1. Calculating similarities for a specific artist
 * 2. Retrieving the calculated similar artists
 * 
 * Usage:
 * node scripts/test-similarity-calculation.js <artist-id>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get artist ID from command line arguments
const artistId = process.argv[2];

if (!artistId) {
  console.error('Please provide an artist ID as a command line argument');
  console.error('Usage: node scripts/test-similarity-calculation.js <artist-id>');
  process.exit(1);
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log(`Testing similarity calculation for artist ID: ${artistId}`);
  
  try {
    // Step 1: Calculate similarities using the Edge Function
    console.log('\n1. Calculating similarities...');
    const { data: calcResult, error: calcError } = await supabase.functions.invoke('calculate-artist-similarities', {
      body: { specificArtistId: artistId }
    });
    
    if (calcError) {
      console.error('Error calculating similarities:', calcError);
      process.exit(1);
    }
    
    console.log('Calculation result:', JSON.stringify(calcResult, null, 2));
    
    // Step 2: Retrieve the similar artists
    console.log('\n2. Retrieving similar artists...');
    const { data: similarArtists, error: fetchError } = await supabase
      .from('artist_similarities')
      .select(`
        similarity_score,
        metadata,
        artist2:artist2_id(
          id, 
          name,
          image_url,
          genres
        )
      `)
      .eq('artist1_id', artistId)
      .order('similarity_score', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('Error fetching similar artists:', fetchError);
      process.exit(1);
    }
    
    console.log(`Found ${similarArtists.length} similar artists:`);
    
    similarArtists.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.artist2.name}`);
      console.log(`   Similarity: ${(item.similarity_score * 100).toFixed(1)}%`);
      console.log(`   Genres: ${item.artist2.genres?.join(', ') || 'None'}`);
      
      if (item.metadata?.factors) {
        console.log('   Factors:');
        console.log(`     - Genre similarity: ${(item.metadata.factors.genre_similarity * 100).toFixed(1)}%`);
        console.log(`     - Name similarity: ${(item.metadata.factors.name_similarity * 100).toFixed(1)}%`);
        console.log(`     - Content similarity: ${(item.metadata.factors.content_similarity * 100).toFixed(1)}%`);
      }
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

main();
