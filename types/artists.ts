export interface Artist {
    id?: string
    is_complete?: boolean
    name: string
    slug: string
    rank?: number | null
    genres?: string[] | null
    rank_change?: number | null
    last_rank_update?: string | null
    bio: string | null
    gender: string | null
    country: string | null
    birth_date: string | null
    image_url: string | null
  }

  export interface ArtistPlatformId {
    artist_id: string
    platform: 'spotify' | 'youtube' | 'musicbrainz'
  }
  
  export interface ArtistUrl {
    artist_id: string
    platform: 'lastfm' | 'spotify' | 'youtube' | 'instagram' | 'tiktok' | 'facebook' | 'viberate'
    url: string
  }

  export interface ArtistMetric {
    id?: string
    artist_id?: string
    platform: string
    metric_type: 'followers' | 'views' | 'likes' | 'subscribers' | 'monthly_listeners' | 'daily_view_count' | 'daily_stream_count' | 'total_views' | 'total_streams'
    value: number
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
    id?: string
    artist_id: string
    video_id: string
  }
  
  // types/database/tracks.ts
  export interface ArtistTrack {
    id?: string
    artist_id: string
    track_id: string
  }

    // types/database/videos.ts
export interface Video {
    id?: string | undefined | null
    title: string
    video_id: string
    platform?: 'youtube'
    view_count: number | null
    monthly_view_count?: number | null
    thumbnail_url: string | null | undefined
    published_at: string | null
  }
  
  // types/database/tracks.ts
  export interface Track {
    id?: string
    title: string
    track_id: string
    platform: 'spotify'
    popularity?: number | null
    stream_count_total: number | null
    stream_count_daily: number | null
    thumbnail_url: string | null
  }

  export interface SpotifyArtist {
    spotify_id: string
    name: string
    image_url: string
    genres: string[]
    popularity: number
    followers: number
  }
  