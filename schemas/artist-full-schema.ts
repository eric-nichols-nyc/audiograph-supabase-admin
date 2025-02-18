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
const platformDataSchema = artistPlatformIdSchema.element.omit({ id: true, artist_id: true });
const urlDataSchema = artistUrlSchema.element.omit({ artist_id: true });
const metricDataSchema = artistMetricSchema.element.omit({ id: true, artist_id: true, date: true });
const trackDataSchema = trackSchema.element.omit({ id: true, created_at: true });
const videoDataSchema = videoSchema.element.omit({ id: true, created_at: true });

export const addArtistFullSchema = z.object({
  artist: artistSchema.omit({ id: true, created_at: true, updated_at: true }),
  platformData: z.array(platformDataSchema),
  urlData: z.array(urlDataSchema).optional(),
  metricData: z.array(metricDataSchema),
  tracks: z.array(trackDataSchema),
  videos: z.array(videoDataSchema),
}); 