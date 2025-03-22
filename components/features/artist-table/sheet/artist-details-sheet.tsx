"use client"

import { useState } from 'react'
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ArtistWithMetrics } from '../types'
import { SimilarArtists } from './similar-sheet-artists'
import { PlatformsSheet } from './platforms'
import { GeoSheet } from './geo'

interface ArtistDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  artist: ArtistWithMetrics | null
}

export function ArtistDetailsSheet({ open, onOpenChange, artist }: ArtistDetailsSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        {artist && (
          <>
            <SheetHeader className="mb-6">
              <SheetTitle className="text-2xl">{artist.name}</SheetTitle>
              <SheetDescription>
                {artist.genres && artist.genres.join(", ")}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6">
              {/* Artist Image */}
              <div className="flex justify-center mb-6">
                <div className="h-32 w-32 rounded-md overflow-hidden">
                  <Image
                    src={artist.image_url || "/images/placeholder.jpg"}
                    alt={artist.name}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Artist Details */}
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-2 items-center">
                  <span className="text-muted-foreground">Rank:</span>
                  <span>{artist.rank}</span>
                </div>

                {artist.country && (
                  <div className="grid grid-cols-2 gap-2 items-center">
                    <span className="text-muted-foreground">Country:</span>
                    <div className="flex items-center gap-1.5">
                      <Image
                        src={`/flags/${artist.country.toLowerCase()}.svg`}
                        alt={artist.country}
                        width={16}
                        height={12}
                        className="rounded-sm"
                      />
                      <span>{artist.country}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 items-center">
                  <span className="text-muted-foreground">Completed:</span>
                  <span>{artist.is_complete ? "Yes" : "No"}</span>
                </div>

                {/* Platform Metrics */}
                <div className="border-t pt-4 mt-2">
                  <h3 className="font-medium mb-3">Platform Metrics</h3>

                  <div className="space-y-3">
                    {/* YouTube */}
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/youtube.svg"
                          alt="YouTube"
                          width={16}
                          height={16}
                        />
                        <span className="text-muted-foreground">Subscribers:</span>
                      </div>
                      <span>
                        {artist.youtube_subscribers
                          ? Intl.NumberFormat('en', { notation: 'compact' }).format(artist.youtube_subscribers)
                          : "-"}
                      </span>
                    </div>

                    {/* Spotify */}
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <Image
                          src="/images/spotify.svg"
                          alt="Spotify"
                          width={16}
                          height={16}
                        />
                        <span className="text-muted-foreground">Popularity:</span>
                      </div>
                      <span>{artist.spotify_popularity || "-"}</span>
                    </div>
                  </div>
                </div>
                <SimilarArtists />
                <PlatformsSheet />
                <GeoSheet />
              </div>

              {/* Actions */}
              <div className="flex justify-between mt-8">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => {
                    window.open(`/artists/${artist.slug}`, '_blank');
                  }}
                >
                  View Full Profile
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
