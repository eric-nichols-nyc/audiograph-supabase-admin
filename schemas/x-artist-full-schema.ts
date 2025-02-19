// This is a minimal stub for addArtistFullSchema.
// In a real application, you might use a validation library such as Zod or Yup
// to define and validate your input schema.
import { z } from "zod";
import { 
  artistSchema, 
  artistPlatformIdSchema, 
  artistUrlSchema, 
  artistMetricSchema, 
  trackSchema, 
  videoSchema 
} from "@/schemas/artists";

// Create versions of the schemas without required IDs for the input validation
const platformDataSchema = z.object({
  platform: z.string(),
  platform_id: z.string()  // This is the actual platform identifier
});

const urlDataSchema = artistUrlSchema.element.omit({ artist_id: true });

const metricDataSchema = z.object({
  platform: z.string(),
  metric_type: z.string(),
  value: z.number()
});

const trackDataSchema = z.object({
  track_id: z.string(),
  title: z.string(),
  platform: z.string().optional(),
  thumbnail_url: z.string().nullable(),
  stream_count_total: z.number().nullable(),
  stream_count_daily: z.number().nullable()
});

const videoDataSchema = z.object({
  video_id: z.string(),
  title: z.string(),
  platform: z.string().optional(),
  view_count: z.number(),
  daily_view_count: z.number(),
  published_at: z.string(),
  thumbnail_url: z.string().optional()
});

export const addArtistFullSchema = z.object({
  artist: artistSchema.omit({ id: true, created_at: true, updated_at: true }),
  platformData: z.array(platformDataSchema),
  urlData: z.array(z.any()).optional(),
  metricData: z.array(metricDataSchema),
  tracks: z.array(trackDataSchema),
  videos: z.array(videoDataSchema),
}); 