# Video Metrics Collection Function

This Edge Function collects and stores historical metrics for YouTube videos, including views, likes, and comments. It processes videos in batches and maintains a 30-day rolling window of metrics data.

## Features

- Batch processing of videos (50 videos per batch)
- YouTube API integration for fetching video statistics
- Historical metrics tracking with 30-day retention
- Trend indicators calculation for views, likes, and comments
- Efficient batch updates to the database

## Data Structure

### Historical Metrics (JSONB)
```json
{
  "views": [
    {"date": "2024-03-15", "count": 5000000},
    {"date": "2024-03-16", "count": 5200000}
  ],
  "likes": [
    {"date": "2024-03-15", "count": 250000},
    {"date": "2024-03-16", "count": 270000}
  ],
  "comments": [
    {"date": "2024-03-15", "count": 15000},
    {"date": "2024-03-16", "count": 16200}
  ]
}
```

### Trend Indicators
```json
{
  "views": "up" | "down" | "stable",
  "likes": "up" | "down" | "stable",
  "comments": "up" | "down" | "stable"
}
```

## Configuration

### Environment Variables

- `YOUTUBE_API_KEY`: Your YouTube Data API key
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

### Database Requirements

The function expects a `videos` table with the following columns:
- `id`: Primary key
- `video_id`: YouTube video ID (NOT NULL)
- `historical_metrics`: JSONB column for storing metrics history
- `trend_indicator`: JSONB column for storing trend indicators
- `metrics_last_updated`: Timestamp of last update

## Deployment

1. Deploy the function:
```bash
supabase functions deploy collect-video-metrics
```

2. Set the required environment variables:
```bash
supabase secrets set YOUTUBE_API_KEY=your_api_key
```

## Scheduled Execution

This function is designed to run daily via the companion `scheduled-video-metrics` function. The scheduled function:
1. Is triggered by a cron job at midnight
2. Calls this function to process all videos
3. Handles batching automatically

### Setting up the Schedule

1. Deploy the scheduled function:
```bash
supabase functions deploy scheduled-video-metrics
```

2. Create a cron job in Supabase Dashboard:
   - Schedule: `0 0 * * *` (midnight daily)
   - Function: `scheduled-video-metrics`

## Trend Calculation

Trends are calculated based on the percentage change between the most recent two data points:
- "up": > 5% increase
- "down": > 5% decrease
- "stable": ≤ 5% change in either direction

## API Response

The function returns a JSON response with:
```json
{
  "success": true,
  "totalProcessed": number,
  "results": [
    {
      "batch": number,
      "processed": number
    }
  ]
}
```

## Error Handling

- Invalid YouTube IDs are skipped
- Failed API requests are logged and skipped
- Database errors trigger a 500 response
- Missing environment variables trigger appropriate errors

## YouTube API Quotas

The function is optimized for YouTube API quota usage:
- Batch requests (50 videos per API call)
- Daily execution (one update per video per day)
- For 1300 videos, requires ~26 API calls per day

## Testing

### Local Testing

1. Start your local Supabase stack:
```bash
supabase start
```

2. Set up local environment variables in a `.env` file:
```bash
YOUTUBE_API_KEY=your_api_key
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=your_local_service_role_key
```

3. Run the function locally:
```bash
supabase functions serve collect-video-metrics --env-file .env
```

4. Test with cURL:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/collect-video-metrics' \
  --header 'Authorization: Bearer your_local_anon_key' \
  --header 'Content-Type: application/json'
```

### Production Testing

1. Get your function URL from the Supabase Dashboard:
```
https://[PROJECT_REF].functions.supabase.co/collect-video-metrics
```

2. Test a single batch:
```bash
curl -i --location --request POST 'https://[PROJECT_REF].functions.supabase.co/collect-video-metrics' \
  --header 'Authorization: Bearer your_anon_key' \
  --header 'Content-Type: application/json'
```

### Monitoring Results

1. Check the function logs in the Supabase Dashboard:
   - Navigate to Edge Functions
   - Select `collect-video-metrics`
   - Click on "Logs"

2. Query the database to verify updates:
```sql
-- Check latest metrics
SELECT id, video_id, metrics_last_updated, trend_indicator 
FROM videos 
WHERE metrics_last_updated IS NOT NULL 
ORDER BY metrics_last_updated DESC 
LIMIT 5;

-- Check historical data for a specific video
SELECT id, video_id, historical_metrics 
FROM videos 
WHERE video_id = 'your_video_id';
```

### Common Issues

1. YouTube API Quota Exceeded
   - Error: `quotaExceeded` in response
   - Solution: Wait for quota reset or use a different API key

2. Invalid YouTube IDs
   - Check logs for skipped videos
   - Verify `video_id` values in database

3. Missing Environment Variables
   - Error: `TypeError: Cannot read properties of null`
   - Solution: Verify all environment variables are set

4. Database Connection Issues
   - Error: `FetchError` or `PostgrestError`
   - Solution: Check database permissions and service role key 