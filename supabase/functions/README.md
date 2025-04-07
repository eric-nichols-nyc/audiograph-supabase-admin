# Supabase Edge Functions

This directory contains Edge Functions that run on Supabase's infrastructure. These functions handle computationally intensive tasks and background processes for the AudioGraph application.

## Functions Overview

### calculate-artist-similarities
Calculates similarity scores between artists based on:
- Genre matching (60% weight)
- Name similarity (10% weight)
- Content analysis (30% weight)

**Endpoint**: `/calculate-artist-similarities`  
**Method**: POST  
**Parameters**:
```typescript
{
  specificArtistId?: string; // Optional: Calculate for specific artist
  limit?: number;            // Optional: Limit number of artists to process
}
```

## Cron Functions

### Daily Artist Similarity Updates
Automatically updates artist similarities for recently added or modified artists.

**Schedule**: Daily at 00:00 UTC  
**Function**: `calculate-artist-similarities`  
**Configuration**:
```sql
select cron.schedule(
  'daily-artist-similarities',
  '0 0 * * *',
  $$
  select net.http_post(
    'https://<project-ref>.functions.supabase.co/calculate-artist-similarities',
    '{"limit": 100}',
    '{}'
  ) as request_id;
  $$
);
```

**Purpose**:
- Keeps artist similarities up to date
- Processes new artists added in the last 24 hours
- Updates existing similarities that are older than 7 days

**Monitoring**:
- Logs available in Supabase Dashboard
- Execution history in `supabase_functions_status` table
- Error notifications via configured channels

## Deployment

Deploy functions using Supabase CLI:
```bash
supabase functions deploy calculate-artist-similarities
```

## Environment Variables

Required environment variables in Supabase Dashboard:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

## Testing

Test functions locally:
```bash
supabase start
supabase functions serve calculate-artist-similarities
```

Make a test request:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/calculate-artist-similarities' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"specificArtistId": "artist_id_here"}'
``` 