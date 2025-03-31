/**
 * Artist Similarity Calculation Service
 * 
 * This service provides a frontend interface to the Supabase Edge Function
 * that calculates artist similarities. It allows for:
 * 
 * 1. Calculating similarities for a specific artist
 * 2. Batch processing multiple artists
 * 3. Retrieving the results of similarity calculations
 * 
 * Unlike the ArtistSimilarityService which performs calculations directly,
 * this service delegates the heavy computation to the Edge Function.
 */
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from '@supabase/supabase-js';

interface CalculationResult {
    success: boolean;
    processed?: Array<{
        artist_id: string;
        artist_name: string;
        similarities_calculated: number;
    }>;
    total_artists_processed?: number;
    error?: string;
    message?: string;
}

type ClientType = 'client' | 'server' | 'route';

export class ArtistSimilarityCalculationService {
    private supabasePromise: Promise<SupabaseClient>;
    private clientType: ClientType;

    /**
     * Create a new instance of the service
     * @param clientType The type of client to create ('client', 'server', or 'route')
     */
    constructor(clientType: ClientType = 'server') {
        this.clientType = clientType;
        this.supabasePromise = createClient();
    }

    /**
     * Get the Supabase client instance
     * @returns Promise that resolves to the Supabase client
     */
    private async getClient(): Promise<SupabaseClient> {
        return this.supabasePromise;
    }

    /**
     * Create an instance of the service for route handlers
     * @returns A new instance configured for route handlers
     */
    static forRouteHandler(): ArtistSimilarityCalculationService {
        return new ArtistSimilarityCalculationService('route');
    }

    /**
     * Create an instance of the service for client components
     * @returns A new instance configured for client-side use
     */
    static forClient(): ArtistSimilarityCalculationService {
        return new ArtistSimilarityCalculationService('client');
    }

    /**
     * Calculate similarities for a specific artist
     * @param artistId UUID of the artist to calculate similarities for
     * @returns Result of the calculation process
     */
    async calculateSimilaritiesForArtist(artistId: string): Promise<CalculationResult> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase.functions.invoke('calculate-artist-similarities', {
                body: { specificArtistId: artistId }
            });

            if (error) {
                console.error('Error calculating similarities:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return data as CalculationResult;
        } catch (error) {
            console.error('Exception calculating similarities:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Calculate similarities for a batch of artists
     * @param limit Number of artists to process (default: 10)
     * @returns Result of the batch calculation process
     */
    async calculateSimilaritiesForBatch(limit = 10): Promise<CalculationResult> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase.functions.invoke('calculate-artist-similarities', {
                body: { limit }
            });

            if (error) {
                console.error('Error calculating batch similarities:', error);
                return {
                    success: false,
                    error: error.message
                };
            }

            return data as CalculationResult;
        } catch (error) {
            console.error('Exception calculating batch similarities:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get similar artists for a given artist from the database
     * @param artistId UUID of the artist to get similarities for
     * @param limit Maximum number of similar artists to return (default: 10)
     * @returns Array of similar artists with their similarity scores
     */
    async getSimilarArtists(artistId: string, limit = 10): Promise<Array<{
        id: string;
        name: string;
        image_url: string;
        genres: string[];
        similarity_score: number;
        factors?: {
            genre_similarity: number;
            name_similarity: number;
            content_similarity: number;
        } | null;
    }>> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from('similar_artists')
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
                .limit(limit);

            if (error) {
                console.error('Error fetching similar artists:', error);
                throw new Error(error.message);
            }

            if (!data || data.length === 0) {
                return [];
            }

            return data.map((item: any) => ({
                id: item.artist2.id,
                name: item.artist2.name,
                image_url: item.artist2.image_url,
                genres: item.artist2.genres,
                similarity_score: item.similarity_score,
                factors: item.metadata?.factors || null
            }));
        } catch (error) {
            console.error('Exception fetching similar artists:', error);
            throw error;
        }
    }

    /**
     * Check if similarities have been calculated for an artist
     * @param artistId UUID of the artist to check
     * @returns True if similarities exist, false otherwise
     */
    async hasSimilarities(artistId: string): Promise<boolean> {
        try {
            const supabase = await this.getClient();
            const { count, error } = await supabase
                .from('similar_artists')
                .select('*', { count: 'exact', head: true })
                .eq('artist1_id', artistId);

            if (error) {
                console.error('Error checking similarities:', error);
                return false;
            }

            return (count || 0) > 0;
        } catch (error) {
            console.error('Exception checking similarities:', error);
            return false;
        }
    }

    /**
     * Get the timestamp of the last similarity calculation for an artist
     * @param artistId UUID of the artist to check
     * @returns ISO timestamp string or null if no calculations exist
     */
    async getLastCalculationTime(artistId: string): Promise<string | null> {
        try {
            const supabase = await this.getClient();
            const { data, error } = await supabase
                .from('similar_artists')
                .select('last_updated')
                .eq('artist1_id', artistId)
                .order('last_updated', { ascending: false })
                .limit(1)
                .single();

            if (error || !data) {
                return null;
            }

            return data.last_updated;
        } catch (error) {
            console.error('Exception getting last calculation time:', error);
            return null;
        }
    }
}
