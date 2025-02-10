import z from "zod";
import { Artist } from "@/types/artists";

export const artistSchema = z.object({
  id: z.string().optional(),
  is_completed: z.boolean(),
  name: z.string(),
  slug: z.string(),
  rank: z.number().nullable(),
  rank_change: z.number().nullable(),
  last_rank_update: z.string().nullable(),
  bio: z.string(),
  gender: z.string(),
  country: z.string(),
  birth_date: z.string(),
  image_url: z.string(),
}) satisfies z.Schema<Artist>;