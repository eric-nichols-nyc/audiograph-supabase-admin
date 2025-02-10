export interface Artist {
    id: string
    is_completed: boolean
    name: string
    slug: string
    rank: number | null
    rank_change: number | null
    last_rank_update: string | null
    bio: string | null
    active_status: boolean
    gender: string | null
    country: string | null
    birth_date: string | null
    image_url: string | null
    created_at: string
    updated_at: string
  }

  export interface ArtistPlatformId {
    artist_id: string
    platform: 'spotify' | 'youtube' | 'lastfm' | 'musicbrainz'
    platform_id: string
    created_at: string
  }
  
  export interface ArtistUrl {
    artist_id: string
    platform: 'spotify' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'viberate'
    url: string
    created_at: string
  }

  export interface ArtistMetric {
    id: string
    artist_id: string
    date: string
    platform: string
    metric_type: 'followers' | 'views' | 'likes' | 'subscribers' | 'monthly_listeners'
    value: number
    created_at: string
  }

  // types/database/rankings.ts
export interface ArtistRanking {
    id: string
    artist_id: string
    rank: number
    date: string
    ranking_type: 'global' | 'genre' | 'country'
    created_at: string
  }

  // types/database/videos.ts
export interface ArtistVideo {
    id: string
    artist_id: string
    title: string
    video_id: string
    platform: 'youtube'
    view_count: number | null
    monthly_view_count: number | null
    thumbnail_url: string | null
    published_at: string | null
    created_at: string
    updated_at: string
  }
  
  // types/database/tracks.ts
  export interface ArtistTrack {
    id: string
    artist_id: string
    title: string
    track_id: string
    platform: 'spotify'
    popularity: number | null
    stream_count_total: number | null
    stream_count_monthly: number | null
    preview_url: string | null
    thumbnail_url: string | null
    external_url: string | null
    published_at: string | null
    created_at: string
    updated_at: string
  }