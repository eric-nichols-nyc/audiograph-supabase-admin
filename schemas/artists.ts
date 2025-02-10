import z from "zod";
import { Artist } from "@/types/artists";

export const artistSchema = z.object({
  id: z.string(),
  is_completed: z.boolean(),
  name: z.string(),
  slug: z.string(),
  rank: z.number(),
  rank_change: z.number(),
  last_rank_update: z.string(),
  bio: z.string(),
  active_status: z.boolean(),
  gender: z.string(),
  country: z.string(),
  birth_date: z.string(),
  image_url: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
}) satisfies z.Schema<Artist>;