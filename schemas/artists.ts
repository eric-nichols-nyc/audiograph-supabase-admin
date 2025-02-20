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
  created_at: z.string(),
  updated_at: z.string(),
}) satisfies z.Schema<Artist>;


export const artistPlatformIdSchema = z.array(z.object({
  id: z.string(),
  artist_id: z.string(),
  platform: z.enum(['spotify', 'youtube', 'lastfm', 'musicbrainz']),
})) satisfies z.Schema<ArtistPlatformId[]>;

export const artistUrlSchema = z.array(z.object({
  artist_id: z.string(),
  platform: z.enum(['lastfm', 'spotify', 'youtube', 'instagram', 'tiktok', 'facebook', 'viberate']),
  url: z.string(),
})) satisfies z.Schema<ArtistUrl[]>;

export const artistMetricSchema = z.array(z.object({
  id: z.string(),
  artist_id: z.string().optional(),
  date: z.string(),
  platform: z.string(),
  metric_type: z.enum(['followers', 'views', 'likes', 'subscribers', 'monthly_listeners', 'daily_view_count', 'daily_stream_count', 'total_views', 'total_streams', 'popularity']),
  value: z.number(),
})) satisfies z.Schema<ArtistMetric[]>;



export const trackSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    track_id: z.string(),
    platform: z.enum(['spotify']).optional(),
    popularity: z.number().nullable().optional(),
    stream_count_total: z.number().nullable(),
    stream_count_daily: z.number().nullable(),
    thumbnail_url: z.string().nullable(),
    created_at: z.string(),
  })
) satisfies z.Schema<Track[]>;

export const videoSchema = z.array(z.object({
  id: z.string(),
  video_id: z.string(),
  title: z.string(),
  platform: z.string().optional(),
  view_count: z.number(),
  daily_view_count: z.number(),
  published_at: z.string(),
  thumbnail_url: z.string().optional(),
  created_at: z.string(),
})) satisfies z.Schema<Video[]>;

export const artistTrackSchema = z.array(z.object({
  artist_id: z.string(),
  track_id: z.string(),
  })) satisfies z.Schema<ArtistTrack[]>;

export const artistVideoSchema = z.array(z.object({
  artist_id: z.string(),
  video_id: z.string(),
})) satisfies z.Schema<ArtistVideo[]>;

export const addArtistFullSchema = z.object({
  artist: artistSchema.omit({ id: true, created_at: true, updated_at: true }),
  platformData: z.array(z.object({
    platform: z.string()
  })),
  urlData: z.array(z.any()).optional(),
  metricData: z.array(artistMetricSchema.element.omit({ id: true, date: true })),
  tracks: z.array(trackSchema.element.omit({ id: true, created_at: true })),
  videos: z.array(videoSchema.element.omit({ id: true, created_at: true }))
}); 