# Artist Similarity System Documentation

## Overview

The Artist Similarity System calculates and maintains similarity scores between artists in the Audiograph platform. It uses a combination of genre matching, name similarity, content embedding comparison, and platform metrics to determine how similar artists are to each other.

## System Components

1. **Edge Function**: `calculate-artist-similarities` - Processes artists and calculates similarity scores
2. **Database Tables**: 
   - `artists` - Stores artist information
   - `artist_articles` - Stores artist content and embeddings
   - `artist_metrics` - Stores platform-specific metrics
   - `artist_similarities` - Stores calculated similarity scores
3. **Scheduled Job**: Automatically runs the similarity calculations on a regular schedule

## Similarity Calculation Algorithm

The system calculates similarity between artists using four components:

1. **Genre Similarity (35%)**: Compares the genres associated with each artist using Jaccard similarity (intersection over union)
2. **Name Similarity (5%)**: Uses a sophisticated name comparison algorithm including word overlap and Levenshtein distance
3. **Content Similarity (20%)**: Uses vector similarity between content embeddings to find semantic relationships
4. **Metrics Similarity (40%)**: Compares platform metrics using logarithmic scaling:
   - Spotify followers (50%)
   - YouTube subscribers (40%)
   - Genius followers (10%)

The final similarity score is a weighted average of these components:
```
similarityScore = (genreSimilarity * 0.35) + (nameSimilarity * 0.05) + (contentSimilarity * 0.20) + (metricsSimilarity * 0.40)
```

### Metrics Similarity Calculation

The metrics similarity component:
- Uses the latest metrics from each platform
- Applies logarithmic scaling to handle large numerical differences
- Weights each platform according to its importance for music artists
- Handles missing data gracefully

Example calculation:
```typescript
// Logarithmic comparison of metrics
const calculateRelativeSimilarity = (val1, val2) => {
  if (val1 === 0 && val2 === 0) return 1
  if (val1 === 0 || val2 === 0) return 0
  const log1 = Math.log10(val1)
  const log2 = Math.log10(val2)
  const diff = Math.abs(log1 - log2)
  return Math.max(0, 1 - (diff / 3))
}
```

### Name Similarity Calculation

The improved name similarity algorithm:
1. Exact match: 100% similarity
2. Word overlap: Up to 80% similarity based on shared words
3. Substring match: 60% similarity
4. Levenshtein distance: Scaled similarity for remaining cases

## Edge Function Implementation

The `calculate-artist-similarities` Edge Function:

1. Fetches artists to process (either a specific artist or a batch)
2. For each source artist:
   - Retrieves their article embedding
   - Fetches other artists to compare with
   - Calculates similarity components for each pair
   - Stores results in the `artist_similarities` table

### Function Parameters

- `limit` (optional): Number of artists to process (default: 10)
- `specificArtistId` (optional): UUID of a specific artist to process

### Response Format

```json
{
  "success": true,
  "processed": [
    {
      "artist_id": "uuid-here",
      "artist_name": "Artist Name",
      "similarities_calculated": 28
    }
  ],
  "total_artists_processed": 1
}
```

## Invoking the Function

### From the CLI

```bash
curl -X POST 'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/calculate-artist-similarities' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{"limit": 10}'
```

### From the Frontend

```javascript
// Using the Supabase client
const { data, error } = await supabase.functions.invoke('calculate-artist-similarities', {
  body: { limit: 10 }
})

// For a specific artist
const { data, error } = await supabase.functions.invoke('calculate-artist-similarities', {
  body: { specificArtistId: "artist-uuid-here" }
})
```

### From Another Edge Function

```typescript
const { data, error } = await supabaseClient.functions.invoke('calculate-artist-similarities', {
  body: { limit: 50 }
})
```

## Setting Up a Scheduled Job

To run the function automatically for all artists, create a scheduled job:

1. Create a new Edge Function for the scheduled job:

```bash
supabase functions new scheduled-calculate-similarities
```

2. Implement the scheduled function:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    // Create a Supabase client with service role key for admin access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role for scheduled jobs
    )
    
    console.log('Starting similarity calculations for all artists')
    
    // Process all artists (set limit higher than your total artist count)
    const { data, error } = await supabaseAdmin.functions.invoke('calculate-artist-similarities', {
      body: { limit: 50 }
    })
    
    if (error) {
      console.error('Error invoking similarity calculation:', error)
      return new Response(
        JSON.stringify({ success: false, error: error.message }),
        { status: 500 }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Scheduled job completed successfully',
        result: data
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

3. Deploy the scheduled function:

```bash
supabase functions deploy scheduled-calculate-similarities
```

4. Set up the cron schedule:

```bash
supabase functions schedule create --function-name scheduled-calculate-similarities --schedule "0 0 * * *" --name daily-similarity-calculation
```

5. Add the service role key secret:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Database Schema

### artists

```sql
create table artists (
  id uuid primary key,
  name text not null,
  genres text[] null,
  created_at timestamp with time zone default now()
  -- other fields omitted for brevity
);
```

### artist_articles

```sql
create table artist_articles (
  id uuid primary key,
  artist_id uuid references artists(id),
  content text,
  embedding vector(1536),
  created_at timestamp with time zone default now()
);
```

### artist_metrics

```sql
create table artist_metrics (
  artist_id uuid references artists(id),
  platform text not null,
  metric_type text not null,
  value numeric not null,
  date timestamp with time zone default now(),
  primary key (artist_id, platform, metric_type, date)
);
```

### artist_similarities

```sql
create table artist_similarities (
  artist1_id uuid references artists(id),
  artist2_id uuid references artists(id),
  similarity_score float not null,
  last_updated timestamp with time zone default now(),
  metadata jsonb,
  primary key (artist1_id, artist2_id)
);
```

## Retrieving Similar Artists with Metrics

To retrieve similar artists with their metrics:

```sql
select 
  s.similarity_score,
  s.metadata,
  a.id as artist_id,
  a.name as artist_name,
  (
    select json_object_agg(platform, value)
    from artist_metrics am
    where am.artist_id = a.id
    and am.date = (
      select max(date)
      from artist_metrics
      where artist_id = a.id
      and platform = am.platform
    )
  ) as latest_metrics
from 
  artist_similarities s
  join artists a on s.artist2_id = a.id
where 
  s.artist1_id = 'source-artist-uuid'
order by 
  s.similarity_score desc
limit 10;
```

## Troubleshooting

### Common Issues

1. **"No artists to process" error**:
   - Verify that artists exist in the database
   - Check that the specified artist ID is correct

2. **Low similarity scores**:
   - Ensure artists have genres assigned
   - Verify that artist_articles have valid embeddings
   - Check that metrics data is available and up-to-date
   - Verify the logarithmic scaling is appropriate for your use case

3. **Missing similar artists**:
   - Confirm that the similarity calculation has been run for the artist
   - Check that there are other artists in the database to compare with
   - Verify that metrics data exists for both artists being compared

4. **Metric-specific issues**:
   - Ensure metrics are being regularly updated
   - Check for any platform-specific API rate limits or errors
   - Verify the metric types match exactly (e.g., 'followers' vs 'subscriber')

### Debugging

The Edge Function includes extensive logging. To view logs:

```bash
supabase functions logs calculate-artist-similarities
```

## Performance Considerations

- The function processes artists one at a time
- For each artist, it compares with up to 100 other artists
- Vector similarity calculations are performed using the database's built-in functions
- Similarities are stored in batches of 50 to avoid hitting Supabase limits

## Maintenance

To update the similarity calculation algorithm:
1. Modify the weighting factors in the Edge Function
2. Update the helper functions as needed
3. Redeploy the function
4. Run a full recalculation for all artists
