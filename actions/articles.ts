"use server";

import { actionClient } from "@/lib/safe-action";
import { createClient } from "../lib/supabase/server";
import { z } from "zod";

// Define an Article type
export interface Article {
  id: string;
  artist_id: string;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Zod schema for Article
export const articleSchema = z.object({
  id: z.string().optional(),
  artist_id: z.string(),
  title: z.string(),
  content: z.string(),
  published_at: z.string().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Fetch articles
export const getArticles = actionClient.action(async (): Promise<Article[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from<Article>("articles").select("*");
  if (error) throw new Error(`Error fetching articles: ${error.message}`);
  return data;
});

// Add an article
export const addArticle = actionClient
  .schema(articleSchema)
  .action(async ({ parsedInput }: { parsedInput: Article }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("articles").insert(parsedInput);
    if (error) throw new Error(`Error adding article: ${error.message}`);
    return data;
});

// Update an article
export const updateArticle = actionClient
  .schema(articleSchema)
  .action(async ({ parsedInput }: { parsedInput: Article }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("articles")
      .update(parsedInput)
      .eq("id", parsedInput.id);
    if (error) throw new Error(`Error updating article: ${error.message}`);
    return data;
});

// Delete an article
export const deleteArticle = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput }: { parsedInput: { id: string } }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("articles").delete().eq("id", parsedInput.id);
    if (error) throw new Error(`Error deleting article: ${error.message}`);
    return data;
}); 