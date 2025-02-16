// This is a minimal stub for addArtistFullSchema.
// In a real application, you might use a validation library such as Zod or Yup
// to define and validate your input schema.
import { z } from "zod";
import { artistSchema, artistPlatformIdSchema, artistUrlSchema, artistMetricSchema, artistTrackSchema, artistVideoSchema, trackSchema, videoSchema } from "@/schemas/artists";

export const addArtistFullSchema = z.object({
  artist: artistSchema,
  platformData: artistPlatformIdSchema,
  urlData: artistUrlSchema,
  metricData: artistMetricSchema,
  tracks: trackSchema,
  videos: videoSchema,
  artist_tracks: artistTrackSchema.optional(),
  artist_videos: artistVideoSchema.optional()
}); 