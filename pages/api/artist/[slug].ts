import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from "@/lib/supabase/server";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).end(); // Only allow GET requests
    return;
  }

  const { slug } = req.query;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('artists')
    .select(`
      *,
      artist_platform_ids(*),
      artist_urls(*),
      artist_metrics(*),
      artist_tracks(*),
      artist_videos(*)
    `)
    .eq("slug", slug)
    .single();

  if (error) {
    res.status(404).json({ message: error.message });
    return;
  }
  
  res.status(200).json(data);
} 