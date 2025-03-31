/**
 * Artist Similarity Service
 * 
 * This service calculates and manages similarity between artists using a multi-factor approach:
 * 
 * 1. Similarity Calculation:
 *    - Genre Similarity (60%): Uses Jaccard similarity to compare genre sets
 *    - Name Similarity (10%): Uses Levenshtein distance to find similar artist names
 *    - Content Similarity (30%): Uses vector similarity between article embeddings
 * 
 * 2. Key Features:
 *    - Find similar artists for a given artist ID
 *    - Calculate direct similarity scores between two artists
 *    - Update stale similarity scores in the database
 *    - Return simplified artist data with similarity scores
 * 
 * 3. Database Integration:
 *    - Uses Supabase for data storage and retrieval
 *    - Leverages PostgreSQL's vector_similarity function for content comparison
 *    - Stores calculated similarities in similar_artists table
 * 
 * The service provides both comprehensive and simplified interfaces for accessing
 * artist similarity data depending on the use case requirements.
 */

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SimilarArtist } from '@/types/artists'
// Represents an artist with their associated article data
interface ArtistWithArticle {
  id: string;
  name: string;
  genres: string[];
  image_url: string;
  artist_articles?: Array<{
    content: string;
    embedding: number[]; // Vector representation of article content
  }>;
}

// Basic artist information without article data
interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
}

// Result of similarity calculation for an artist
interface SimilarityScore {
  artist: ArtistWithArticle;
  score: number; // 0-1 where 1 is most similar
}

// Different factors used to calculate similarity
interface SimilarityFactors {
  genres: number;
  name: number;
  contentSimilarity: number;
}

// Add this new interface for simplified artist data
interface SimplifiedArtist {
  id: string;
  name: string;
  image_url: string;
}

// Add this interface for the response
interface SimilarArtistResult {
  artist: SimplifiedArtist;
  score: number;
}

interface SimilarArtistResponse {
  similarity_score: number;
  similar_artist: {
    id: string;
    name: string;
    image_url: string;
    genres: string[];
  };
}


export class ArtistSimilarityService {
  private supabase;

  constructor() {
    this.supabase = createServerComponentClient({ cookies });
  }

  private weights = {
    genres: 0.6,            // Genre match is most important
    name: 0.1,             // Similar names
    contentSimilarity: 0.3  // Similar article content
  };

  /**
   * Find artists similar to the given artist ID
   * @param artistId - ID of the source artist
   * @param limit - Maximum number of similar artists to return
   * @returns Array of similar artists, sorted by similarity score
   */
  async findSimilarArtists(artistId: string, limit = 10): Promise<ArtistWithArticle[]> {
    console.log('Finding similar artists for:', artistId);

    const { data: sourceArtist, error: sourceError } = await this.supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        genres,
        artist_articles!artist_articles_artist_id_fkey (
          content,
          embedding
        )
      `)
      .eq('id', artistId)
      .single();

    if (sourceError) {
      console.error('Error fetching source artist:', sourceError);
      return [];
    }

    const { data: allArtists, error: allError } = await this.supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        genres,
        artist_articles!artist_articles_artist_id_fkey (
          content,
          embedding
        )
      `)
      .neq('id', artistId)
      .limit(100);

    if (allError) {
      console.error('Error fetching all artists:', allError);
      return [];
    }

    const artistsWithScores = await Promise.all(
      allArtists.map(async (artist) => ({
        artist,
        score: await this.calculateSimilarityScore(sourceArtist, artist)
      }))
    );

    return artistsWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.artist);
  }

  /**
   * Calculate overall similarity score between two artists
   * @returns Score between 0-1 where 1 is most similar
   */
  private async calculateSimilarityScore(artist1: ArtistWithArticle, artist2: ArtistWithArticle): Promise<number> {
    const factors: SimilarityFactors = {
      genres: this.calculateGenreSimilarity(artist1.genres, artist2.genres),
      name: this.calculateNameSimilarity(artist1.name, artist2.name),
      contentSimilarity: await this.calculateContentSimilarity(
        artist1.artist_articles?.[0],
        artist2.artist_articles?.[0]
      )
    };

    return Object.entries(factors).reduce((score, [factor, value]) => {
      return score + (value * this.weights[factor as keyof SimilarityFactors]);
    }, 0);
  }

  /**
   * Calculate similarity of genres using Jaccard similarity
   * @returns Score between 0-1 where 1 means identical genres
   */
  private calculateGenreSimilarity(genres1: string[], genres2: string[]): number {
    if (!genres1 || !genres2) return 0;
    const set1 = new Set(genres1);
    const set2 = new Set(genres2);
    const intersection = Array.from(set1).filter(x => set2.has(x));
    const union = Array.from(new Set([...genres1, ...genres2]));
    return intersection.length / union.length;
  }

  /**
   * Calculate similarity of artist names using Levenshtein distance
   * @returns Score between 0-1 where 1 means identical names
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const distance = this.levenshteinDistance(
      name1.toLowerCase(),
      name2.toLowerCase()
    );
    const maxLength = Math.max(name1.length, name2.length);
    return 1 - (distance / maxLength);
  }

  /**
   * Calculate Levenshtein (edit) distance between two strings
   * @returns Number of character edits needed to transform str1 into str2
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );

    // Initialize first row and column
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    // Fill in the rest of the matrix
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + substitutionCost  // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity between article embeddings using vector similarity
   * @returns Score between 0-1 where 1 means very similar content
   */
  private async calculateContentSimilarity(article1?: { embedding: number[] }, article2?: { embedding: number[] }): Promise<number> {
    if (!article1?.embedding || !article2?.embedding) return 0;

    // Use PostgreSQL vector similarity function
    const { data } = await this.supabase.rpc('vector_similarity', {
      vec1: article1.embedding,
      vec2: article2.embedding
    });

    return data || 0;
  }

  async getSimilarityScore(artist1Id: string, artist2Id: string): Promise<number> {
    const [artist1Result, artist2Result] = await Promise.all([
      this.supabase
        .from('artists')
        .select(`
          *,
          artist_articles!artist_articles_artist_id_fkey (
            content,
            embedding
          )
        `)
        .eq('id', artist1Id)
        .single(),
      this.supabase
        .from('artists')
        .select(`
          *,
          artist_articles!artist_articles_artist_id_fkey (
            content,
            embedding
          )
        `)
        .eq('id', artist2Id)
        .single()
    ]);

    if (!artist1Result.data || !artist2Result.data) {
      return 0;
    }

    return this.calculateSimilarityScore(artist1Result.data, artist2Result.data);
  }

  async updateStaleSimilarities(daysThreshold: number = 7): Promise<void> {
    const staleThreshold = new Date();
    staleThreshold.setDate(staleThreshold.getDate() - daysThreshold);

    const { data: staleScores } = await this.supabase
      .from('similar_artists')
      .select('artist1_id, artist2_id')
      .lt('last_updated', staleThreshold.toISOString());

    if (!staleScores) return;

    for (const score of staleScores) {
      await this.getSimilarityScore(score.artist1_id, score.artist2_id);
    }
  }

  // Modify the method to return simplified data
  async findSimilarArtistsWithScores(artistId: string, limit = 10): Promise<SimilarArtistResult[]> {
    console.log('Finding similar artists for:', artistId);

    // Update query to select only needed fields
    const { data: sourceArtist, error: sourceError } = await this.supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        genres,
        artist_articles!artist_articles_artist_id_fkey (
          content,
          embedding
        )
      `)
      .eq('id', artistId)
      .single();

    if (sourceError) {
      console.error('Error fetching source artist:', sourceError);
      return [];
    }

    // Update query for other artists
    const { data: allArtists, error: allError } = await this.supabase
      .from('artists')
      .select(`
        id,
        name,
        image_url,
        genres,
        artist_articles!artist_articles_artist_id_fkey (
          content,
          embedding
        )
      `)
      .neq('id', artistId)
      .limit(100);

    if (allError) {
      console.error('Error fetching all artists:', allError);
      return [];
    }

    if (!allArtists?.length) {
      console.log('No other artists found');
      return [];
    }

    console.log('Found', allArtists.length, 'other artists');

    // Calculate scores but return simplified data
    const artistsWithScores = await Promise.all(
      allArtists.map(async (artist) => {
        const score = await this.calculateSimilarityScore(sourceArtist, artist);
        return {
          artist: {
            id: artist.id,
            name: artist.name,
            image_url: artist.image_url
          },
          score
        };
      })
    );

    return artistsWithScores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }


  async getSimilarArtists(artistId: string, limit = 5) {
    const { data, error } = await this.supabase
      .from('similar_artists')
      .select(`
    similarity_score,
    similar_artist:artist2_id(
      id, 
      name,
      image_url,
      genres
    )
  `)
      .eq('artist1_id', artistId)
      .order('similarity_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching similar artists:', error.message);
      //return { success: false, message: error.message };
      throw new Error(error.message)
    }

    return (data as unknown as SimilarArtistResponse[]).map((item: SimilarArtistResponse): SimilarArtist => ({
      id: item.similar_artist.id,
      name: item.similar_artist.name,
      image_url: item.similar_artist.image_url,
      genres: item.similar_artist.genres,
      similarity_score: item.similarity_score
    }));

  }
}
