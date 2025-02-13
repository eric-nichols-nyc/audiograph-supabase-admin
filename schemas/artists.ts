import z from "zod";
import { Artist, ArtistMetric, ArtistPlatformId, Track, ArtistUrl, Video, ArtistVideo, ArtistTrack } from "@/types/artists";

export const artistSchema = z.object({
  id: z.string().optional(),
  is_complete: z.boolean().optional(),
  name: z.string(),
  slug: z.string(),
  rank: z.number().nullable().optional(),
  rank_change: z.number().nullable().optional(),
  last_rank_update: z.string().nullable().optional(),
  bio: z.string(),
  gender: z.string(),
  country: z.string(),
  birth_date: z.string(),
  image_url: z.string(),
  genres: z.array(z.string()).nullable(),
}) satisfies z.Schema<Artist>;


export const artistPlatformIdSchema = z.array(z.object({
  artist_id: z.string(),
  platform: z.enum(['spotify', 'youtube', 'lastfm', 'musicbrainz']),
  platform_id: z.string(),
})) satisfies z.Schema<ArtistPlatformId[]>;

export const artistUrlSchema = z.array(z.object({
  artist_id: z.string(),
  platform: z.enum(['lastfm', 'spotify', 'youtube', 'instagram', 'tiktok', 'facebook', 'viberate']),
  url: z.string(),
  created_at: z.string(),
})) satisfies z.Schema<ArtistUrl[]>;

export const artistMetricSchema = z.array(z.object({
  artist_id: z.string(),
  platform: z.string(),
  metric_type: z.enum(['followers', 'views', 'likes', 'subscribers', 'monthly_listeners']),
  value: z.number(),
})) satisfies z.Schema<ArtistMetric[]>;



export const trackSchema = z.array(z.object({
  title: z.string(),
  track_id: z.string(),
  platform: z.enum(['spotify']),
  popularity: z.number().nullable().optional(),
  stream_count_total: z.number().nullable(),
  stream_count_daily: z.number().nullable(),
  thumbnail_url: z.string().nullable(),
  })) satisfies z.Schema<Track[]>;

export const videoSchema = z.array(z.object({
  title: z.string(),
  video_id: z.string(),
  platform: z.enum(['youtube']),
  view_count: z.number().nullable(),
  monthly_view_count: z.number().nullable(),
  thumbnail_url: z.string().nullable(),
  published_at: z.string().nullable(),
})) satisfies z.Schema<Video[]>;

export const artistTrackSchema = z.array(z.object({
  artist_id: z.string(),
  track_id: z.string(),
  })) satisfies z.Schema<ArtistTrack[]>;

export const artistVideoSchema = z.array(z.object({
  artist_id: z.string(),
  video_id: z.string(),
})) satisfies z.Schema<ArtistVideo[]>;
