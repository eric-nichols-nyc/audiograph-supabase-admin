# Scheduled Artist Metrics

Cron-style wrapper that invokes `collect-artist-metrics`. Use this when you want Supabase to run the metrics collection on a schedule.

## Deploy

```bash
supabase functions deploy scheduled-artist-metrics
```

## Run the collector (any of these)

### 1. Run `collect-artist-metrics` directly (manual)

```bash
curl -X POST 'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/collect-artist-metrics' \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Use your **Supabase service role key** (Dashboard → Settings → API).

### 2. Run via your Next.js app

```bash
curl -X POST 'http://localhost:3001/api/admin/trigger-youtube-metrics'
```

That route calls `collect-artist-metrics` for you (uses `SUPABASE_SERVICE_ROLE_KEY` from env).

### 3. Run the scheduled wrapper (same as cron would)

```bash
curl -X POST 'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/scheduled-artist-metrics' \
  -H "Authorization: Bearer YOUR_ANON_OR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Schedule in Supabase

1. **Dashboard → Database → Extensions**: enable `pg_cron` and `pg_net` if needed.
2. **Dashboard → Database → Cron Jobs** (or run SQL): schedule a job that calls your function.

Example (replace `YOUR_SERVICE_ROLE_KEY` with the real key, or use a DB secret):

```sql
SELECT cron.schedule(
  'collect-artist-metrics',
  '0 2 * * *',  -- daily at 2 AM UTC
  $$ SELECT net.http_post(
    'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/scheduled-artist-metrics',
    '{}',
    'application/json',
    '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'
  ) $$
);
```

Or schedule the collector directly:

```sql
SELECT cron.schedule(
  'collect-artist-metrics',
  '0 2 * * *',
  $$ SELECT net.http_post(
    'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/collect-artist-metrics',
    '{}',
    'application/json',
    '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY", "Content-Type": "application/json"}'
  ) $$
);
```

Ensure the Edge Function has required secrets set (Dashboard → Edge Functions → collect-artist-metrics → Secrets): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `YOUTUBE_API_KEY`, `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `GENIUS_ACCESS_TOKEN`.
