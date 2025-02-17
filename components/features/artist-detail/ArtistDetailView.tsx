import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArtistDetailViewProps } from './types';
import { BasicInfo } from './BasicInfo';
import { PlatformIds } from './PlatformIds';
import { MetricsCard } from './MetricsCard';
import { TracksSection } from './TracksSection';
import { VideosSection } from './VideosSection';

export function ArtistDetailView({ data }: ArtistDetailViewProps) {
  if (!data) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">No artist data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="tracks">Tracks</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BasicInfo artist={data} />
          <PlatformIds platformIds={data.artist_platform_ids || []} />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsCard metrics={data.artist_metrics || []} />
        </TabsContent>

        <TabsContent value="tracks">
          <TracksSection tracks={data.artist_tracks || []} />
        </TabsContent>

        <TabsContent value="videos">
          <VideosSection videos={data.artist_videos || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 