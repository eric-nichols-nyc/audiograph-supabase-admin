# Recalculate All Artist Similarities

## Overview

This Edge Function performs a complete recalculation of all artist similarities in the Audiograph platform. It's designed to be used when you need to refresh all similarity scores, such as after updating the similarity calculation algorithm or when you want to ensure all scores are up to date.

## Operation

The function performs the following steps:
1. Counts total number of artists in the database
2. Clears all existing similarity records from the `similar_artists` table
3. Invokes the main `calculate-artist-similarities` function with a limit that covers all artists

## Usage

### From the CLI

```bash
curl -X POST 'https://fwirjtvwqndshynbbbyf.supabase.co/functions/v1/recalculate-all-similarities' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

### From the Frontend

```typescript
const { data, error } = await supabase.functions.invoke('recalculate-all-similarities')
```

### From Another Edge Function

```typescript
const { data, error } = await supabaseClient.functions.invoke('recalculate-all-similarities')
```

## Response Format

Success Response:
```json
{
  "success": true,
  "message": "Recalculated all artist similarities",
  "result": {
    "processed": [
      {
        "artist_id": "uuid-here",
        "artist_name": "Artist Name",
        "similarities_calculated": 28
      }
    ],
    "total_artists_processed": 29
  }
}
```

Error Response:
```json
{
  "error": "Error message here"
}
```

## Important Notes

1. This is a potentially long-running operation depending on the number of artists
2. All existing similarity scores will be deleted before recalculation
3. The function uses the latest version of the similarity algorithm, which includes:
   - Genre matching (35%)
   - Name similarity with Levenshtein distance (5%)
   - Content embedding comparison (20%)
   - Platform metrics comparison (40%)

## When to Use

Use this function when:
- The similarity calculation algorithm has been updated
- You've added new metrics or data that affect similarity scores
- You suspect there might be stale or incorrect similarity data
- After a large batch of new artists has been added

## Security

The function requires authentication and can only be called by:
- Authenticated users with appropriate permissions
- Other Edge Functions using service role credentials
- Admin users through the Supabase dashboard

## Monitoring

The function logs important steps to the console:
- Number of artists found
- Confirmation of similarity data clearing
- Any errors that occur during processing

You can monitor the execution through the Supabase dashboard's Function Logs. 