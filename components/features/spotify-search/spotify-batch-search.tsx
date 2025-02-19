"use client"

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { debounce } from '@/utils/debounce'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SpotifyArtist } from '@/types/artists'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useArtists } from '@/hooks/use-artists'

interface ArtistSearchResultProps {
    artist: SpotifyArtist
    isSelected: boolean
    onSelect: (artist: SpotifyArtist) => void
}

function ArtistSearchResult({ artist, isSelected, onSelect }: ArtistSearchResultProps) {
    return (
        <button
            onClick={() => onSelect(artist)}
            className={`w-full flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg transition-colors ${
                isSelected ? 'bg-secondary/50' : ''
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
            <div className="flex-1 text-left">
                <div className="font-medium">{artist.name}</div>
                <div className="text-sm text-muted-foreground">
                    {artist.genres.slice(0, 2).join(', ')}
                </div>
            </div>
            <div className="text-sm text-muted-foreground">
                {artist.followers?.toLocaleString()} followers
            </div>
        </button>
    )
}

interface SpotifyBatchSearchProps {
    onArtistSelect: (artist: SpotifyArtist) => void
    selectedArtists?: SpotifyArtist[]
    clearOnSelect?: boolean
}

export function SpotifyBatchSearch({ 
    onArtistSelect, 
    selectedArtists = [],
    clearOnSelect = false
}: SpotifyBatchSearchProps) {
    const { data: existingArtists } = useArtists()
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<SpotifyArtist[]>([])
    const [isSearching, setIsSearching] = useState(false)

    const isArtistInDatabase = (spotifyId: string) => {
        if (!existingArtists?.data?.length) return false;
        return existingArtists.data.some(
            (existing: any) => existing.spotify_id === spotifyId
        );
    };

    const searchSpotify = debounce(async (query: string) => {
        if (!query) {
            setSearchResults([])
            return
        }

        try {
            setIsSearching(true)
            const response = await fetch(`/api/spotify/search?q=${query}`)
            const data = await response.json()
            
            // Filter out existing artists
            const filteredResults = data.artists.filter(
                (artist: SpotifyArtist) => !isArtistInDatabase(artist.spotify_id)
            );
            
            setSearchResults(filteredResults)
        } catch (error) {
            console.error('Spotify search error:', error)
            setSearchResults([])
        } finally {
            setIsSearching(false)
        }
    }, 500)

    useEffect(() => {
        searchSpotify(searchQuery)
    }, [searchQuery])

    const handleSelect = (artist: SpotifyArtist) => {
        onArtistSelect(artist)
        setSearchQuery('')
        setSearchResults([])
    }

    const isArtistSelected = (spotifyId: string) => {
        return selectedArtists.some(artist => artist.spotify_id === spotifyId)
    }

    return (
        <Card className="flex-1">
            <CardContent>
                <div className="space-y-4">
                    <Input
                        placeholder="Search Spotify artists..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />

                    {isSearching ? (
                        <div className="flex items-center justify-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        </div>
                    ) : searchResults.length > 0 ? (
                        <ScrollArea className="h-[300px]">
                            <div className="space-y-2">
                                {searchResults.map((artist) => (
                                    <ArtistSearchResult
                                        key={artist.spotify_id}
                                        artist={artist}
                                        isSelected={isArtistSelected(artist.spotify_id)}
                                        onSelect={handleSelect}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    ) : searchQuery ? (
                        <div className="text-center text-muted-foreground py-4">
                            No artists found
                        </div>
                    ) : null}
                </div>
            </CardContent>
        </Card>
    )
} 