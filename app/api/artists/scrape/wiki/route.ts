import { createClient } from '@/utils/supabase/server';
import { OpenAI } from 'openai';

// You can also import types if needed:
// import { Database } from '@/types/supabase';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface WikipediaResponse {
  query: {
    pages: {
      [key: string]: {
        pageid: number;
        title: string;
        extract: string;
        categories: Array<{ title: string }>;
        links: Array<{ title: string }>;
        revisions: Array<{ timestamp: string }>;
      };
    };
  };
}

interface WikipediaArticle {
  title: string;
  content: string;
  categories: string[];
  links: string[];
  lastUpdated: string;
  url: string;
}

interface ProcessedArticle extends WikipediaArticle {
  embedding: number[];
  relevanceScore: number;
}


// Main function to scrape and store Wikipedia articles
export async function scrapeAndStoreWikipedia(artistId: string, artistName: string) {
  try {
    console.log('Using Supabase client from utils/supabase');

    // Fetch Wikipedia article
    const article = await fetchWikipediaArticle(artistName);
    if (!article) {
      return {
        success: false as const,
        error: 'No Wikipedia article found'
      };
    }

    // Clean and process the article
    const processedArticle = await processArticle(article);

    // Store in database
    const result = await storeArticle(artistId, processedArticle);

    // Update artist similarities
    await updateArtistSimilarities(artistId, processedArticle);

    return {
      success: true as const,
      data: result
    };

  } catch (error) {
    console.error('Error in scrapeAndStoreWikipedia:', error);
    return {
      success: false as const,
      error: error instanceof Error ? error.message : 'Failed to process Wikipedia article'
    };
  }
}

// Fetch article from Wikipedia API
async function fetchWikipediaArticle(artistName: string): Promise<WikipediaArticle | null> {
  const searchUrl = new URL('https://en.wikipedia.org/w/api.php');
  searchUrl.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    prop: 'extracts|categories|links|revisions',
    titles: artistName,
    exintro: '1',
    explaintext: '1',
    cllimit: '500',
    rvprop: 'timestamp',
    rvlimit: '1'
  }).toString();

  try {
    const response = await fetch(searchUrl.toString());
    if (!response.ok) throw new Error('Failed to fetch from Wikipedia API');

    const data: WikipediaResponse = await response.json();
    const page = Object.values(data.query.pages)[0];

    if (!page) return null;

    return {
      title: page.title,
      content: page.extract,
      categories: page.categories?.map(c => c.title) || [],
      links: page.links?.map(l => l.title) || [],
      lastUpdated: page.revisions?.[0]?.timestamp || new Date().toISOString(),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`
    };
  } catch (error) {
    console.error('Error fetching Wikipedia article:', error);
    return null;
  }
}

// Clean Wikipedia text content
function cleanWikipediaText(text: string): string {
  return text
    .replace(/\[\d+\]/g, '') // Remove reference numbers
    .replace(/==.*?==/g, '') // Remove section headers
    .replace(/\{\{.*?\}\}/g, '') // Remove Wikipedia templates
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1') // Clean wiki links
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n+/g, '\n') // Normalize line breaks
    .replace(/\(listen\)/gi, '') // Remove (listen) tags
    .replace(/\s+([.,;:])/g, '$1') // Fix spacing around punctuation
    .trim();
}

// Process article content
async function processArticle(article: WikipediaArticle): Promise<ProcessedArticle> {
  // Clean the content
  const cleanedContent = cleanWikipediaText(article.content);

  // Generate embedding using OpenAI
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: `${article.title}\n${cleanedContent}`,
  });

  const relevanceScore = calculateRelevanceScore(article);

  return {
    ...article,
    content: cleanedContent,
    embedding: embeddingResponse.data[0].embedding,
    relevanceScore
  };
}

// Calculate article relevance score
function calculateRelevanceScore(article: WikipediaArticle): number {
  const musicCategories = [
    'musicians', 'singer', 'artist', 'band', 'composer',
    'songwriter', 'rapper', 'producer', 'dj'
  ];

  // Count music-related categories
  const relevantCategories = article.categories.filter(category =>
    musicCategories.some(term =>
      category.toLowerCase().includes(term.toLowerCase())
    )
  ).length;

  // Basic scoring formula: content length score (max 1) and category relevance (max 1)
  const contentScore = Math.min(article.content.length / 1000, 1);
  const categoryScore = Math.min(relevantCategories / 5, 1);

  return (contentScore * 0.6) + (categoryScore * 0.4);
}

// Store article in our database
async function storeArticle(artistId: string, article: ProcessedArticle) {
  const articleData = {
    artist_id: artistId,
    title: article.title,
    content: article.content,
    source_url: article.url,
    publication_date: article.lastUpdated,
    embedding: article.embedding,
    metadata: {
      source: 'wikipedia',
      categories: article.categories,
      links: article.links,
      last_updated: article.lastUpdated,
      relevance_score: article.relevanceScore
    }
  };
  const supabase = await createClient();

  // Check for an existing article for this artist from Wikipedia
  const { data: existingArticle } = await supabase
    .from('artist_articles')
    .select('id')
    .eq('artist_id', artistId)
    .eq('metadata->source', 'wikipedia')
    .single();

  if (existingArticle) {
    // Update the existing article
    const { data, error } = await supabase
      .from('artist_articles')
      .update(articleData)
      .eq('id', existingArticle.id)
      .select();

    if (error) throw error;
    return data;
  } else {
    // Insert new article
    const { data, error } = await supabase
      .from('artist_articles')
      .insert(articleData)
      .select();

    if (error) throw error;
    return data;
  }
}

// Update artist similarities based on the new article
async function updateArtistSimilarities(artistId: string, article: ProcessedArticle) {
    const supabase = await createClient();

  // Call a stored procedure ("match_articles") in Supabase to find similar articles
  const { data: similarArticles } = await supabase.rpc('match_articles', {
    query_embedding: article.embedding,
    match_threshold: 0.7,
    match_count: 10
  });

  if (!similarArticles?.length) return;

  // Prepare similarity records for artists with similar articles
  const similarityRecords = similarArticles
    .filter((similar: any) => similar.artist_id !== artistId)
    .map((similar: any) => ({
      artist_id: artistId,
      similar_artist_id: similar.artist_id,
      similarity_score: similar.similarity,
      last_updated: new Date().toISOString(),
      metadata: {
        source: 'wikipedia',
        shared_categories: findSharedCategories(article, similar),
        content_similarity: similar.similarity
      }
    }));

  if (similarityRecords.length > 0) {
    await supabase
      .from('artist_similarities')
      .upsert(similarityRecords);
  }
}

// Helper function to compute shared categories between two articles
function findSharedCategories(article1: ProcessedArticle, article2: { categories: string[] }): string[] {
  const categories1 = new Set(article1.categories);
  return article2.categories.filter((category: string) => categories1.has(category));
}

// API route entry point
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const artistId = searchParams.get('artistId');
    const artistName = searchParams.get('artistName');
    
    console.log('API Route - Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('API Route - Service Key (first 10 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 10));

    if (!artistId || !artistName) {
      return new Response(
        JSON.stringify({ error: 'Artist ID and artist name are required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = await scrapeAndStoreWikipedia(artistId, artistName);
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('API Route Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}