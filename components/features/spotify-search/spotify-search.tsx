"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { debounce } from '@/utils/debounce'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SpotifyArtist } from '@/types/artists'

/**
* ArtistSearchResult Component
* Renders individual artist search result
*/
interface ArtistSearchResultProps {
    artist: SpotifyArtist
    isProcessing: boolean
    onSelect: (artist: SpotifyArtist) => void
}

function ArtistSearchResult({ artist, isProcessing, onSelect }: ArtistSearchResultProps) {
    return (
        <div
            onClick={() => !isProcessing && onSelect(artist)}
            className={`flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                }`}
        >
            {artist.image_url && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                        src={artist.image_url}
                        alt={artist.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                    />
                </div>
            )}
            <div className="flex-1">
                <div className="font-medium">{artist.name}</div>
                <div className="text-sm text-gray-500">
                    {artist.genres.slice(0, 2).join(', ')}
                </div>
            </div>
            <div className="text-sm text-gray-500">
                {artist.followers?.toLocaleString()} followers
            </div>
            {isProcessing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            )}
        </div>
    )
}


interface SpotifySearchProps {
    onArtistSelect: (artist: SpotifyArtist) => void
    onClearSelection?: () => void
}
export function SpotifySearch({ onArtistSelect, onClearSelection }: SpotifySearchProps) {
    const router = useRouter()
    //const profileStore = useArtistProfileStore()
    //const addArtist = useArtistsStore((state) => state.addArtist)
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isProcessing, setIsProcessing] = useState(false)
    const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null)

    /**
   * Debounced function to search Spotify API
   */
    const searchSpotify = debounce(async (query: string) => {
        if (!query) {
            setSearchResults([])
            return
        }

        try {
            setIsSearching(true)
            const response = await fetch(`/api/spotify/search?q=${query}`)
            const data = await response.json()
            console.log('spotify search data', data)
            setSearchResults(data.artists)

            // For testing purposes, we're using a static artist object instead of making an API call.
            // const testArtist: SpotifyArtist = {
            //     spotify_id: "7dGJo4pcD2V6oG8kP0tJRR",
            //     name: "Eminem",
            //     image_url:
            //         "https://i.scdn.co/image/ab6761610000e5eba00b11c129b27a88fc72f36b",
            //     genres: ["rap", "hip hop"],
            //     popularity: 90,
            //     followers: 97262923,
            // }

            // setSearchResults([testArtist])
        } catch (error) {
            console.error('Spotify search error:', error)
        } finally {
            setIsSearching(false)
        }
    }, 500)

    useEffect(() => {
        searchSpotify(searchQuery)
    }, [searchQuery])


    /**
     * Handles the artist selection and creation process
     */
    const handleArtistSelect = async (spotifyArtist: SpotifyArtist) => {
        console.log('spotifyArtist', spotifyArtist)
        setSelectedArtist(spotifyArtist)
        setSearchQuery('')
        setSearchResults([])
        onArtistSelect(spotifyArtist)
    }

    const clearSelection = () => {
        setSelectedArtist(null)
        setSearchQuery('')
        onClearSelection?.()
    }

    /**
    * Render artist search results
    */
    const renderSearchResults = () => {
        if (isSearching) {
            return (
                <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                </div>
            )
        }

        if (searchResults.length > 0) {
            return (
                <div className="space-y-3">
                    {searchResults.map((artist) => (
                        <ArtistSearchResult
                            key={artist.spotify_id}
                            artist={artist}
                            isProcessing={isProcessing}
                            onSelect={handleArtistSelect}
                        />
                    ))}
                </div>
            )
        }

        if (searchQuery) {
            return (
                <div className="text-center text-gray-500 py-4">
                    No artists found
                </div>
            )
        }

        return null
    }




    return (
        <Card className="flex-1">
            <CardContent>
                <div className="mb-6">
                    {selectedArtist ? (
                        <div className="relative">
                            <ArtistSearchResult
                                artist={selectedArtist}
                                isProcessing={isProcessing}
                                onSelect={() => {}}
                            />
                            <button
                                onClick={clearSelection}
                                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <Input
                            placeholder="Search Spotify artists..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    )}
                </div>
                {!selectedArtist && renderSearchResults()}
            </CardContent>
        </Card>
    )
}