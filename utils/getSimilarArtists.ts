import { createClient } from '@/utils/supabase/server';

interface SimilarArtist {
  id: string;            // the article id returned by match_articles
  artist_id: string;     // the similar artist's id
  title: string;         // the Wikipedia article title
  similarity: number;    // the computed similarity score
  // Additional fields from the artists table:
  name?: string;
  genre?: string;
  popularity?: number;
  image?: string;
}

/**
 * Retrieves a list of similar artists based on the Wikipedia article embedding.
 * It:
 *  - Retrieves the embedding for the given artist from the `artist_articles` table.
 *  - Calls the stored procedure `match_articles` with that embedding.
 *  - Enriches the results with extra artist data (e.g. genre, popularity, etc.) from the artists table.
 *  - Returns the enriched similar artists as an array.
 */
export async function getSimilarArtists(artistId: string): Promise<SimilarArtist[]> {
  const supabase = await createClient();

  // Retrieve the current artist's Wikipedia article embedding from artist_articles.
  // This query assumes that Wikipedia articles store their source information in the metadata JSON.
  const { data: article, error } = await supabase
    .from('artist_articles')
    .select('embedding')
    .eq('artist_id', artistId)
    .eq('metadata->>source', 'wikipedia')
    .single();

  if (error || !article) {
    throw error || new Error('No Wikipedia article found for this artist');
  }

  const queryEmbedding = article.embedding;

  // Call the stored procedure "match_articles" that returns similar Wikipedia articles.
  // This procedure uses the pgvector operator (<=>) to compute distances.
  const { data: similarArticles, error: rpcError } = await supabase.rpc('match_articles', {
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: 10,
  });

  if (rpcError) {
    throw rpcError;
  }

  // Cast similarArticles (if not tsc-inferred)
  const similar: SimilarArtist[] = similarArticles as SimilarArtist[];

  // Extract the list of similar artist IDs from the RPC response.
  const similarArtistIds = similar.map((sa) => sa.artist_id);

  // Retrieve additional data (e.g. name, genre, popularity, image) from your artists table.
  const { data: artistsInfo, error: artistError } = await supabase
    .from('artists')
    .select('id, name, genre, popularity, image')  // adjust fields as needed
    .in('id', similarArtistIds);

  if (artistError) {
    throw artistError;
  }

  // Build a lookup table for additional artist data.
  const artistMap: { [key: string]: any } = {};
  artistsInfo?.forEach((artist: any) => {
    artistMap[artist.id] = artist;
  });

  // Enrich the similar artists with additional information.
  const enrichedSimilarArtists = similar.map((sa: SimilarArtist) => ({
    ...sa,
    ...artistMap[sa.artist_id],
  }));

  return enrichedSimilarArtists;
} 