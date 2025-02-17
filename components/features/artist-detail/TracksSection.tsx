import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArtistTrack, formatDate } from './types';

interface TracksSectionProps {
  tracks?: ArtistTrack[];
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
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {index + 1}. {track.track_id || 'Untitled Track'}
                  </span>
                  <span className="text-sm text-gray-500">Added: {formatDate(track.created_at)}</span>
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