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

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button"
import { useSearchParams } from "next/navigation";
import { SimilarArtist } from "@/types/artists";

export function SimilarArtists() {
    const params = useSearchParams()
    const [similarArtists, setSimilarArtists] = useState<SimilarArtist[]>([])
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const fetchSimilarArtists = async (artistId: string) => {
        if (!artistId) {
            setError("No artist ID provided")
            return
        }

        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch(`/api/artists/get-similar-artists?id=${artistId}`)
            if (!response.ok) {
                const errorText = `Error fetching similar artists: ${response.status}`
                console.error(errorText)
                setError(errorText)
                setSimilarArtists([])
                return
            }

            const json = await response.json()
            console.log('similar artists = ', json)

            if (!json.success) {
                setError(json.message || "Failed to fetch similar artists")
                setSimilarArtists([])
                return
            }

            setSimilarArtists(json.data || [])
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
            console.error('Failed to fetch similar artists:', error)
            setError(`Failed to fetch similar artists: ${errorMessage}`)
            setSimilarArtists([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        console.log('artistId :', params?.get('artistId'))
        const artistId = params?.get('artistId')
        if (!artistId) {
            console.warn('No artistId provided')
            setError("No artist ID provided")
            return
        }

        fetchSimilarArtists(artistId)
    }, [params])

    const handleGenerateSimilarArtists = () => {
        const artistId = params?.get('artistId')
        if (artistId) {
            fetchSimilarArtists(artistId)
        } else {
            setError("No artist ID provided")
        }
    }


    return (
        <div className="w-full bg-[#141e3c] text-white p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-1">Similar Artists</h1>

            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
            ) : similarArtists.length > 0 ? (
                <div className="flex flex-wrap justify-between gap-4 mb-4">
                    {similarArtists.map((artist, index) => (
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
            ) : !error && (
                <div className="text-center py-6 text-gray-400">
                    No similar artists found
                </div>
            )}

            <Button
                onClick={handleGenerateSimilarArtists}
                disabled={isLoading || !params?.get('artistId')}
                className="mt-2"
            >
                {isLoading ? 'Loading...' : 'Generate Similar Artists'}
            </Button>
        </div>
    )
}
