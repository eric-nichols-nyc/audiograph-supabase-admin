import React from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Track, ArtistTrack } from '@/types/artists';
import { formatDate } from '@/utils/format/dates';

type ArtistWithTrack = Track & ArtistTrack;


interface TracksSectionProps {
  tracks?: ArtistWithTrack[];
}

export function TracksSection({ tracks = [] }: TracksSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Tracks ({tracks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {tracks.length > 0 ? (
          <div className="space-y-4">
            {tracks.map((track, index) => (
              <div key={track.id || index} className="p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  {track.thumbnail_url ? (
                    <Image 
                      src={track.thumbnail_url}
                      alt={track.title || 'Track thumbnail'}
                      width={64}
                      height={64}
                      className="rounded-md"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {index + 1}. {track.track_id || 'Untitled Track'}
                      </span>
                      <span className="text-sm text-gray-500">Added: {formatDate(track.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No tracks available</p>
        )}
      </CardContent>
    </Card>
  );
} 