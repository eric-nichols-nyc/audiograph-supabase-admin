export interface ArtistPlatformId {
  id: string;
  platform: string;
  artist_id: string;
  created_at: string;
}

export interface ArtistMetric {
  id: string;
  date: string;
  value: number;
  platform: string;
  artist_id: string;
  created_at: string;
  updated_at: string;
  metric_type: string;
}

export interface ArtistTrack {
  id: string;
  role: string;
  track_id: string;
  artist_id: string;
  created_at: string;
}

export interface ArtistVideo {
  id: string;
  role: string;
  video_id: string;
  artist_id: string;
  created_at: string;
}

export interface Artist {
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

export interface ArtistDetailViewProps {
  data?: Artist | null;
}

export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat().format(num);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 