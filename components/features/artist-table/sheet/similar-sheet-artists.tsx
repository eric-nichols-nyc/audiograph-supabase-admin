"use client"
/**
 * SimilarArtists Component
 * 
 * Data Flow:
 * 1. Component extracts artistId from URL search parameters
 * 2. Makes a fetch request to /api/artists/get-similar-artists?id={artistId}
 * 3. The API endpoint uses ArtistSimilarityService to query the database
 * 4. ArtistSimilarityService fetches data from the artist_similarities table in Supabase
 * 5. The component receives and displays similar artists with their similarity scores
 * 
 * The similarity is calculated based on genres, name similarity, and content analysis
 * stored in the database.
 */

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button"
import { useSimilarArtists, useSimilarArtistsMutation } from "@/lib/queries/artists";

export function SimilarArtists() {
    const params = useSearchParams();
    const artistId = params?.get('artistId');

    // Query for fetching existing similar artists
    const {
        data: similarArtists = [],
        isLoading: isLoadingSimilar,
        isError,
        error
    } = useSimilarArtists(artistId);

    // Mutation for generating similar artists
    const mutation = useSimilarArtistsMutation();

    const handleGenerateSimilarArtists = () => {
        if (artistId) {
            mutation.mutate(artistId);
        }
    };

    return (
        <div className="w-full bg-[#141e3c] text-white p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-1">Similar Artists</h1>

            {isError && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-md mb-4">
                    {error instanceof Error ? error.message : 'Error loading similar artists'}
                </div>
            )}

            {isLoadingSimilar ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
            ) : similarArtists.length > 0 ? (
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                    {similarArtists.slice(0, 5).map((artist) => (
                        <div
                            key={artist.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-blue-500/5 border border-blue-500/10 hover:bg-blue-500/10 transition-colors w-full"
                        >
                            <span className="font-medium text-blue-200/90">{artist.name}</span>
                            <span className="text-sm text-blue-200/60">
                                {(artist.similarity_score * 100).toFixed(1)}% match
                            </span>
                        </div>
                    ))}
                </div>
            ) : !isError && (
                <div className="text-center py-6 text-gray-400">
                    No similar artists found
                </div>
            )}

            <Button
                onClick={handleGenerateSimilarArtists}
                disabled={mutation.isPending || !artistId}
                className="mt-2"
            >
                {mutation.isPending ? 'Generating...' : 'Generate Similar Artists'}
            </Button>
        </div>
    );
}
