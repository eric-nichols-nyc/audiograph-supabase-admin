import { Artist, ArtistPlatformId, ArtistUrl, ArtistMetric, ArtistRanking } from './artists';

export interface Database {
    public: {
      Tables: {
        artists: {
          Row: Artist
          Insert: Omit<Artist, 'id' | 'created_at' | 'updated_at'>
          Update: Partial<Omit<Artist, 'id'>>
        }
        artist_platform_ids: {
          Row: ArtistPlatformId
          Insert: Omit<ArtistPlatformId, 'created_at'>
          Update: Partial<Omit<ArtistPlatformId, 'artist_id' | 'platform'>>
        }
        artist_urls: {
          Row: ArtistUrl
          Insert: Omit<ArtistUrl, 'created_at'>
          Update: Partial<Omit<ArtistUrl, 'artist_id' | 'platform'>>
        }
        artist_metrics: {
          Row: ArtistMetric
          Insert: Omit<ArtistMetric, 'id' | 'created_at'>
          Update: Partial<Omit<ArtistMetric, 'id'>>
        }
        artist_rankings: {
          Row: ArtistRanking
          Insert: Omit<ArtistRanking, 'id' | 'created_at'>
          Update: Partial<Omit<ArtistRanking, 'id'>>
        }
      }
    }
  }
  