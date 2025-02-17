import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Video } from '@/types/artists';
import { VideosTable } from './videos-table';

interface VideosSectionProps {
  videos?: Video[];
}

export function VideosSection({ videos = [] }: VideosSectionProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Videos ({videos.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {videos.length > 0 ? (
          <VideosTable videos={videos} />
        ) : (
          <p className="text-gray-500">No videos available</p>
        )}
      </CardContent>
    </Card>
  );
} 