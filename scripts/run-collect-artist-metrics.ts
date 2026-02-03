/**
 * Run collect-artist-metrics locally: fetch platform metrics and insert into DB.
 * Uses .env.local for SUPABASE_* and API keys.
 *
 * Run: pnpm run collect-metrics
 * Or:  npx tsx scripts/run-collect-artist-metrics.ts
 */

import dotenv from "dotenv";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const BATCH_SIZE = 10;

async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Missing Spotify credentials");

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials" }).toString(),
  });
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("No Spotify access token in response");
  return data.access_token;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

  console.log("Fetching artist platforms...");
  const { data: artistPlatforms, error: artistError } = await supabase
    .from("artist_platform_ids")
    .select("artist_id, platform_id, platform")
    .not("platform_id", "is", null);

  if (artistError) {
    console.error("Error fetching artist platforms:", artistError);
    process.exit(1);
  }
  if (!artistPlatforms?.length) {
    console.log("No artist platforms to process.");
    return;
  }

  console.log(`Found ${artistPlatforms.length} platform rows. Processing in batches of ${BATCH_SIZE}...`);

  let spotifyAccessToken: string | null = null;
  try {
    spotifyAccessToken = await getSpotifyAccessToken();
  } catch (e) {
    console.warn("Spotify token failed (Spotify metrics will be skipped):", (e as Error).message);
  }

  let youtubeCount = 0;
  let spotifyCount = 0;
  let deezerCount = 0;
  let geniusCount = 0;

  for (let i = 0; i < artistPlatforms.length; i += BATCH_SIZE) {
    const batch = artistPlatforms.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(artistPlatforms.length / BATCH_SIZE)}`);

    for (const row of batch) {
      try {
        const timestamp = new Date().toISOString();

        if (row.platform === "youtube") {
          const youtubeKey = process.env.YOUTUBE_API_KEY;
          if (!youtubeKey) {
            console.warn("YOUTUBE_API_KEY missing, skipping YouTube");
            continue;
          }
          const res = await fetch(
            `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${row.platform_id}&key=${youtubeKey}`
          );
          const data = (await res.json()) as {
            items?: Array<{ statistics?: { subscriberCount?: string; viewCount?: string } }>;
          };
          const subCount = data.items?.[0]?.statistics?.subscriberCount;
          const viewCount = data.items?.[0]?.statistics?.viewCount;

          if (subCount) {
            await supabase.from("artist_metrics").insert({
              artist_id: row.artist_id,
              platform: "youtube",
              metric_type: "subscribers",
              value: parseInt(subCount, 10),
              date: timestamp,
            });
            youtubeCount++;
          }
          if (viewCount) {
            await supabase.from("artist_metrics").insert({
              artist_id: row.artist_id,
              platform: "youtube",
              metric_type: "views",
              value: parseInt(viewCount, 10),
              date: timestamp,
            });
          }
          const { data: prevViews } = await supabase
            .from("artist_metrics")
            .select("value")
            .eq("artist_id", row.artist_id)
            .eq("platform", "youtube")
            .eq("metric_type", "views")
            .lt("date", timestamp)
            .order("date", { ascending: false })
            .limit(1)
            .single();
          if (prevViews?.value != null && viewCount != null) {
            const daily = parseInt(viewCount, 10) - Number(prevViews.value);
            if (daily >= 0) {
              await supabase.from("artist_metrics").insert({
                artist_id: row.artist_id,
                platform: "youtube",
                metric_type: "daily_view_count",
                value: daily,
                date: timestamp,
              });
            }
          }
        }

        if (row.platform === "spotify" && spotifyAccessToken) {
          const res = await fetch(`https://api.spotify.com/v1/artists/${row.platform_id}`, {
            headers: { Authorization: `Bearer ${spotifyAccessToken}` },
          });
          const data = (await res.json()) as { followers?: { total?: number }; popularity?: number };
          if (data.followers?.total !== undefined) {
            await supabase.from("artist_metrics").insert({
              artist_id: row.artist_id,
              platform: "spotify",
              metric_type: "followers",
              value: data.followers.total,
              date: timestamp,
            });
            spotifyCount++;
          }
          if (data.popularity !== undefined) {
            await supabase.from("artist_metrics").insert({
              artist_id: row.artist_id,
              platform: "spotify",
              metric_type: "popularity",
              value: data.popularity,
              date: timestamp,
            });
          }
        }

        if (row.platform === "deezer") {
          const res = await fetch(`https://api.deezer.com/artist/${row.platform_id}`);
          if (!res.ok) continue;
          const data = (await res.json()) as { nb_fan?: number };
          if (typeof data.nb_fan === "number") {
            await supabase.from("artist_metrics").insert({
              artist_id: row.artist_id,
              platform: "deezer",
              metric_type: "followers",
              value: data.nb_fan,
              date: timestamp,
            });
            deezerCount++;
          }
        }

        if (row.platform === "genius") {
          const geniusToken = process.env.GENIUS_ACCESS_TOKEN;
          if (!geniusToken) continue;
          const res = await fetch(`https://api.genius.com/artists/${row.platform_id}`, {
            headers: { Authorization: `Bearer ${geniusToken}` },
          });
          if (!res.ok) continue;
          const data = (await res.json()) as { response?: { artist?: { followers_count?: number } } };
          const count = data.response?.artist?.followers_count;
          if (typeof count === "number") {
            await supabase.from("artist_metrics").insert({
              artist_id: row.artist_id,
              platform: "genius",
              metric_type: "followers",
              value: count,
              date: timestamp,
            });
            geniusCount++;
          }
        }
      } catch (err) {
        console.error(`Error for ${row.artist_id} / ${row.platform}:`, (err as Error).message);
      }
    }
  }

  await supabase.from("activity_logs").insert({
    timestamp: new Date().toISOString(),
    type: "success",
    message: "Artist metrics collection completed",
    platform: "system",
    details: `Processed ${artistPlatforms.length} rows (YouTube: ${youtubeCount}, Spotify: ${spotifyCount}, Deezer: ${deezerCount}, Genius: ${geniusCount})`,
  });
  await supabase.from("notifications").insert({
    title: "Metrics Collection Complete",
    message: `Collected metrics (YouTube: ${youtubeCount}, Spotify: ${spotifyCount}, Deezer: ${deezerCount}, Genius: ${geniusCount})`,
    type: "success",
    created_at: new Date().toISOString(),
  });

  console.log("Done. YouTube:", youtubeCount, "Spotify:", spotifyCount, "Deezer:", deezerCount, "Genius:", geniusCount);
  console.log("\n→ Refresh the metrics page (or hard refresh / click Update) to see new data.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
