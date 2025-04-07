# Collect Artist Metrics Edge Function

This Edge Function collects various metrics for artists across multiple platforms (Spotify, YouTube, and Deezer) and stores them in the `artist_metrics` table.

## Metrics Collected

### Spotify
- **Followers**: Total number of followers on Spotify
- **Popularity**: Spotify's popularity score (0-100)

### YouTube
- **Subscribers**: Total channel subscribers
- **Views**: Total channel views

### Deezer
- **Followers**: Total number of Deezer fans

## How It Works

1. **Authentication**: The function requires a valid JWT token for authorization

2. **Data Flow**:
   - Fetches artist platform IDs from `artist_platform_ids` table
   - Processes artists in batches (10 at a time) to avoid rate limits
   - Makes API calls to each platform to collect metrics
   - Stores metrics in the `artist_metrics` table

3. **Error Handling**:
   - Logs errors to `activity_logs` table
   - Continues processing remaining artists if one fails
   - Sends notifications for completion/failures

## Database Schema

```sql
CREATE TABLE artist_metrics (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  artist_id uuid NULL,
  date date NOT NULL DEFAULT now(),
  platform character varying NOT NULL,
  metric_type character varying NOT NULL,
  value bigint NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now()
);
```

## Required Environment Variables

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `YOUTUBE_API_KEY`: YouTube Data API key
- `SPOTIFY_CLIENT_ID`: Spotify API client ID
- `SPOTIFY_CLIENT_SECRET`: Spotify API client secret

## Usage

### Via SQL
```sql
SELECT net.http_post(
  url := 'https://[PROJECT_REF].supabase.co/functions/v1/collect-artist-metrics',
  headers := jsonb_build_object(
    'Authorization', format('Bearer %s', current_setting('supabase.service_role_key')),
    'Content-Type', 'application/json'
  ),
  body := '{}'::jsonb
);
```

### Via Edge Function URL
```bash
curl -i -X POST 'https://[PROJECT_REF].supabase.co/functions/v1/collect-artist-metrics' \
  -H "Authorization: Bearer [ACCESS_TOKEN]" \
  -H "Content-Type: application/json"
```

## Monitoring

### Check Recent Metrics
```sql
SELECT 
    a.name as artist_name,
    am.platform,
    am.metric_type,
    am.value,
    am.date
FROM artist_metrics am
JOIN artists a ON a.id = am.artist_id
WHERE am.date >= NOW() - INTERVAL '1 hour'
ORDER BY am.date DESC, a.name, am.platform, am.metric_type;
```

### Check Activity Logs
```sql
SELECT *
FROM activity_logs
WHERE timestamp >= NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

## Deployment

Deploy the function using the Supabase CLI:
```bash
supabase functions deploy collect-artist-metrics
``` 