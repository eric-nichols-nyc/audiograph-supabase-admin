export interface Artist {
  id?: string;
  is_complete?: boolean;
  name: string;
  slug: string;
  rank?: number | null;
  genres?: string[] | null;
  popularity?: number | null;
  rank_change?: number | null;
  last_rank_update?: string | null;
  bio: string | null;
  gender: string | null;
  country: string | null;
  birth_date: string | null;
  image_url: string | null;
  created_at?: string;
  updated_at?: string;
  artist_platform_ids?: Array<{
    platform: string;
    platform_id: string;
  }>;
}

export interface ArtistPlatformId {
  id: string;
  artist_id: string;
  platform: 'spotify' | 'youtube' | 'musicbrainz' | 'deezer';
}

export interface ArtistUrl {
  artist_id: string;
  platform: 'lastfm' | 'spotify' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'viberate';
  url: string;
}

export interface ArtistMetric {
  id: string;
  artist_id?: string;
  date: string;
  platform: string;
  metric_type:
    | 'followers'
    | 'views'
    | 'likes'
    | 'subscribers'
    | 'monthly_listeners'
    | 'daily_view_count'
    | 'daily_stream_count'
    | 'total_views'
    | 'total_streams'
    | 'popularity';
  value: number;
}

// types/database/rankings.ts
export interface ArtistRanking {
  id: string;
  artist_id: string;
  rank: number;
  date: string;
  ranking_type: 'global' | 'genre' | 'country';
  created_at: string;
}

// types/database/videos.ts
export interface ArtistVideo {
  id?: string;
  artist_id: string;
  video_id: string;
}

// types/database/tracks.ts
export interface ArtistTrack {
  id?: string;
  artist_id: string;
  track_id: string;
}

// types/database/videos.ts
export interface Video {
  id?: string | undefined | null;
  title: string;
  video_id: string;
  platform?: string;
  view_count: number | null;
  monthly_view_count?: number | null;
  daily_view_count?: number | null;
  thumbnail_url?: string | null | undefined;
  published_at: string | null;
  created_at?: string;
}

// types/database/tracks.ts
export interface Track {
  id?: string;
  title: string;
  track_id: string;
  platform?: 'spotify';
  popularity?: number | null;
  stream_count_total: number | null;
  stream_count_daily: number | null;
  thumbnail_url: string | null;
  created_at?: string;
}

export interface SpotifyArtist {
  spotify_id: string;
  name: string;
  image_url: string;
  genres: string[];
  popularity: number;
  followers: number;
}

/**
 * Maps to the "artist_articles" table in your database.
 */
export interface ArtistArticle {
  id?: string; // uuid, primary key
  artist_id: string | null; // uuid, can be null
  title: string;
  content: string;
  url: string | null;
  publication_date: string | null; // ISO date string; alternatively, use Date if you prefer
  embedding: number[] | null; // Assuming "public.vector" is a vector of numbers
  sentiment_score: number | null;
  metadata: Record<string, any> | null; // JSONB field
}
