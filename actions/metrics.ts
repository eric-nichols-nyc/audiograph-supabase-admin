"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../lib/supabase/server";
import { z } from "zod";
import { ArtistMetric } from "../types/artists";

// Schema for ArtistMetric
export const metricSchema = z.object({
  id: z.string().optional(),
  artist_id: z.string(),
  date: z.string(),
  platform: z.string(),
  metric_type: z.enum(['followers', 'views', 'likes', 'subscribers', 'monthly_listeners']),
  value: z.number(),
  created_at: z.string().optional(),
});

// Fetch metrics
export const getMetrics = actionClient.action(async (): Promise<ArtistMetric[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from<ArtistMetric>("metrics").select("*");
  if (error) throw new Error(`Error fetching metrics: ${error.message}`);
  return data;
});

// Add a metric
export const addMetric = actionClient
  .schema(metricSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistMetric }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("metrics").insert(parsedInput);
    if (error) throw new Error(`Error adding metric: ${error.message}`);
    return data;
});

// Update a metric
export const updateMetric = actionClient
  .schema(metricSchema)
  .action(async ({ parsedInput }: { parsedInput: ArtistMetric }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("metrics")
      .update(parsedInput)
      .eq("id", parsedInput.id);
    if (error) throw new Error(`Error updating metric: ${error.message}`);
    return data;
});

// Delete a metric
export const deleteMetric = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }: { parsedInput: { id: string } }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("metrics").delete().eq("id", parsedInput.id);
    if (error) throw new Error(`Error deleting metric: ${error.message}`);
    return data;
}); 