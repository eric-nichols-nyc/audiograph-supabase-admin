interface ArtistPlatformId {
  id: string;
  platform: string;
  artist_id: string;
  created_at: string;
}

interface ArtistMetric {
  id: string;
  date: string;
  value: number;
  platform: string;
  artist_id: string;
  created_at: string;
  updated_at: string;
  metric_type: string;
}

interface ArtistTrack {
  id: string;
  role: string;
  track_id: string;
  artist_id: string;
  created_at: string;
}

interface ArtistVideo {
  id: string;
  role: string;
  video_id: string;
  artist_id: string;
  created_at: string;
}

interface Artist {
  id: string;
  name: string;
  slug: string;
  bio: string;
  gender: string;
  country: string;
  birth_date: string;
  image_url: string;
  created_at: string;
  updated_at: string;
  is_complete: boolean;
  genres: string[];
  artist_platform_ids: ArtistPlatformId[];
  artist_urls?: any[];
  artist_metrics: ArtistMetric[];
  artist_tracks: ArtistTrack[];
  artist_videos: ArtistVideo[];
}

interface ArtistDetailViewProps {
  data?: Artist | null;
}

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formatNumber = (num: number | null | undefined) => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat().format(num);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const MetricsCard = ({ metrics = [] }: { metrics: ArtistMetric[] }) => {
  const latestMetrics = metrics.reduce((acc: Record<string, ArtistMetric>, curr) => {
    if (
      !acc[curr.platform] ||
      new Date(curr.date) > new Date(acc[curr.platform].date)
    ) {
      acc[curr.platform] = curr;
    }
    return acc;
  }, {} as Record<string, ArtistMetric>);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Platform Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(latestMetrics).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(latestMetrics).map(([platform, metric]) => (
              <div key={platform} className="p-4 border rounded-lg">
                <h3 className="font-semibold capitalize mb-2">{platform}</h3>
                <div className="text-sm text-gray-600">
                  <p>{metric.metric_type}: {formatNumber(metric.value)}</p>
                  <p className="text-xs mt-1">Updated: {formatDate(metric.date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No metrics available</p>
        )}
      </CardContent>
    </Card>
  );
};

const TracksSection = ({ tracks = [] }: { tracks: ArtistTrack[] }) => (
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
                <span className="font-medium">{index + 1}. {track.track_id || 'Untitled Track'}</span>
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

const VideosSection = ({ videos = [] }: { videos: ArtistVideo[] }) => (
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
                <span className="font-medium">{index + 1}. {video.video_id || 'Untitled Video'}</span>
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

const BasicInfo = ({ artist }: { artist: Artist }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Basic Information</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex gap-6">
        <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name || 'Artist'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{artist.name || 'Unknown Artist'}</h2>
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Country:</span> {artist.country || 'N/A'}</p>
            <p><span className="font-medium">Gender:</span> {artist.gender || 'N/A'}</p>
            <p><span className="font-medium">Birth Date:</span> {formatDate(artist.birth_date)}</p>
            <p><span className="font-medium">Genres:</span> {Array.isArray(artist.genres) ? artist.genres.join(', ') : 'N/A'}</p>
          </div>
        </div>
      </div>
      <div className="mt-4">
        <p className="text-gray-700">{artist.bio || 'No biography available'}</p>
      </div>
    </CardContent>
  </Card>
);

const PlatformIds = ({ platformIds = [] }: { platformIds: ArtistPlatformId[] }) => (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle>Platform IDs</CardTitle>
    </CardHeader>
    <CardContent>
      {platformIds.length > 0 ? (
        <div className="space-y-2">
          {platformIds.map((platform, index) => (
            <div key={platform.id || index} className="flex justify-between items-center p-2 border-b">
              <span className="font-medium capitalize">{platform.platform || 'Unknown Platform'}</span>
              <span className="text-sm text-gray-600">{platform.id || 'N/A'}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500">No platform IDs available</p>
      )}
    </CardContent>
  </Card>
);

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
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <BasicInfo artist={data} />
          <PlatformIds platformIds={data.artist_platform_ids || []} />
        </TabsContent>

        <TabsContent value="metrics">
          <MetricsCard metrics={data.artist_metrics || []} />
        </TabsContent>

        <TabsContent value="content">
          <TracksSection tracks={data.artist_tracks || []} />
          <VideosSection videos={data.artist_videos || []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}