import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Video, ArtistVideo } from '@/types/artists';
import { formatDate } from '@/utils/format/dates';



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
          <div className="space-y-4">
            {videos.map((video, index) => (
              <div key={video.id || index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {index + 1}. {video.video_id || 'Untitled Video'}
                  </span>
                  <span className="text-sm text-gray-500">Added: {formatDate(video.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No videos available</p>
        )}
      </CardContent>
    </Card>
  );
} 