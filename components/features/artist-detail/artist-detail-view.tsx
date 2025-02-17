import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArtistInfo } from './artist-info';
import { PlatformIds } from './PlatformIds';
import { MetricsCard } from './metric-card';
import { TracksSection } from './TracksSection';
import { VideosSection } from './VideosSection';
import { Artist, ArtistPlatformId, ArtistMetric, ArtistTrack, ArtistVideo } from '@/types/artists';

export interface FullArtist {
  artist: Artist;
  artist_platform_ids: ArtistPlatformId[];
  artist_metrics: ArtistMetric[];
  artist_tracks: ArtistTrack[];
  artist_videos: ArtistVideo[];
}

export interface ArtistDetailViewProps {
  data?: FullArtist | null;
}

export function ArtistDetailView({ artist, artist_platform_ids, artist_metrics, artist_tracks, artist_videos }: FullArtist) {
  if (!artist) {
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
          <ArtistInfo artist={artist} />
          <PlatformIds platformIds={artist_platform_ids || []} />
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