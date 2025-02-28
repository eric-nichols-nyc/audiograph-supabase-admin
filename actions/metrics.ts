"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { ArtistMetric } from "../types/artists";

// Schema for ArtistMetric
const metricSchema = z.object({
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

// Update this action to return all metrics for the artist
export const getArtistMetrics = actionClient.action(async (input: unknown): Promise<ArtistMetric[]> => {
  // Extract the path from the wrapped input
  const path = typeof input === 'object' && input !== null ? (input as any).clientInput : input;
  
  const supabase = await createClient();
  
  if (!path || typeof path !== 'string') {
    throw new Error('Invalid path');
  }

  // Extract slug from path (e.g., /artists/artist-slug/metrics)
  const pathParts = path.split('/').filter(Boolean);
  const slug = pathParts[pathParts.length - 2];
  
  if (!slug) {
    throw new Error('Could not extract artist slug from path');
  }

  // First get the artist id from slug
  const { data: artist } = await supabase
    .from('artists')
    .select('id')
    .eq('slug', slug)
    .single();
    
  if (!artist) throw new Error('Artist not found');

  // Then get their metrics - get all metrics for the past 30 days to calculate growth
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const { data, error } = await supabase
    .from('artist_metrics')
    .select('*')
    .eq('artist_id', artist.id)
    .gte('date', thirtyDaysAgo.toISOString())
    .order('date', { ascending: false });


    console.log('metrics data', data);

  if (error) throw new Error(`Error fetching metrics: ${error.message}`);
  
  // Return the array directly instead of wrapping it
  return Array.isArray(data) ? data : [];
}); 