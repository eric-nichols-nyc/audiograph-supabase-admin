import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArtistInfo } from './artist-info';
import { PlatformIds } from './platgorm_id';
import { MetricsCard } from './metric-card';
import { TracksSection } from './artist-tracks';
import { VideosSection } from './artist-videos';
import { Artist, ArtistPlatformId, ArtistMetric, Track, ArtistVideo, ArtistTrack, Video } from '@/types/artists';

type ArtistWithTrack = Track & ArtistTrack;
type ArtistWithVideo = Video & ArtistVideo; 

export interface FullArtist {
    artist: Artist;
    artist_platform_ids: ArtistPlatformId[];
    artist_metrics: ArtistMetric[];
    artist_tracks: Track[];
    artist_videos: Video[];
}

export interface ArtistDetailViewProps {
  data: FullArtist;
}

export const ArtistDetailView = ({ data }: ArtistDetailViewProps) => {
  const {artist, artist_platform_ids, artist_metrics, artist_tracks, artist_videos} = data;
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
          <ArtistInfo artist={artist} />
          <PlatformIds platformIds={artist_platform_ids || []} />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsCard metrics={artist_metrics || []} />
        </TabsContent>

        <TabsContent value="tracks">
          <TracksSection tracks={artist_tracks || []} />
        </TabsContent>

        <TabsContent value="videos">
          <VideosSection videos={artist_videos || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
} 