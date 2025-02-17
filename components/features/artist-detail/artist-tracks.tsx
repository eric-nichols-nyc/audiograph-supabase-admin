import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Track } from '@/types/artists';
import { TracksTable } from './tracks-table';

interface TracksSectionProps {
  tracks?: Track[];
}

export function TracksSection({ tracks = [] }: TracksSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Tracks ({tracks.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {tracks.length > 0 ? (
          <TracksTable tracks={tracks} />
        ) : (
          <p className="text-gray-500">No tracks available</p>
        )}
      </CardContent>
    </Card>
  );
} 