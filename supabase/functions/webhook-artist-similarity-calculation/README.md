# Webhook Artist Similarity Calculation

This edge function automatically calculates similar artists when a new artist is added to the database. It works in conjunction with a Supabase database webhook to trigger the calculation process.

## Purpose

When a new artist is added to the `artists` table, this function:

1. Receives the webhook payload containing the new artist data
2. Extracts the artist ID from the payload
3. Calls the existing `calculate-artist-similarities` edge function with that specific artist ID
4. Returns a success/error response with detailed information

This automation ensures that similarity calculations happen immediately after artist creation, eliminating the need for manual triggers or scheduled jobs for this specific use case.

## How It Works

### Technical Flow

1. Supabase database webhook detects an INSERT operation on the `artists` table
2. The webhook sends a POST request to this edge function with the new artist data
3. This function extracts the artist ID from the `record.id` field in the payload
4. It then calls the `calculate-artist-similarities` edge function with the `specificArtistId` parameter
5. The similarity calculation is performed and results are stored in the `artist_similarities` table
6. This function returns a response indicating success or failure

### Code Overview

- The function uses the Supabase client to call another edge function
- It handles CORS preflight requests for browser compatibility
- It includes comprehensive error handling and logging
- The webhook payload is expected to follow the standard Supabase format with a `record` object

## Setup Instructions

### 1. Deploy the Edge Function

```bash
cd supabase
npx supabase functions deploy webhook-artist-similarity-calculation
```

### 2. Create the Database Webhook

In the Supabase Dashboard:

1. Navigate to your project
2. Go to Database → Webhooks
3. Click "Create a new webhook"
4. Configure the webhook with these settings:
   - Name: `artist-similarity-calculation`
   - Table: `artists`
   - Events: Select only `INSERT` (when a new artist is added)
   - HTTP Method: `POST`
   - URL: `https://<your-project-ref>.supabase.co/functions/v1/webhook-artist-similarity-calculation`
   - Headers: Add `Authorization: Bearer <your-anon-key>` (replace with your actual anon key)
   - Request Body: Select `Change Data` to include the new artist data in the payload
   - Enable the webhook by toggling it on

## Testing

To test if the webhook and function are working correctly:

1. Add a new artist to your database through your application or directly via SQL:
   ```sql
   INSERT INTO artists (name, genres, image_url) 
   VALUES ('Test Artist', ARRAY['pop', 'rock'], 'https://example.com/image.jpg');
   ```

2. Check the Supabase logs:
   - Go to Dashboard → Edge Functions → webhook-artist-similarity-calculation → Logs
   - Look for log entries showing the webhook payload and calculation results

3. Verify that similar artists were calculated by querying the `artist_similarities` table:
   ```sql
   SELECT * FROM artist_similarities 
   WHERE artist1_id = '<id-of-the-artist-you-added>' 
   ORDER BY similarity_score DESC;
   ```

## Troubleshooting

### Common Issues

1. **Webhook not triggering**:
   - Check if the webhook is enabled in the Supabase Dashboard
   - Verify that you're inserting records into the correct table (`artists`)
   - Check the webhook logs in the Supabase Dashboard

2. **Function returning errors**:
   - Check the function logs for specific error messages
   - Verify that the `calculate-artist-similarities` function is deployed and working
   - Ensure the webhook payload contains the expected data structure

3. **No similarities being calculated**:
   - Verify that there are other artists in the database to compare with
   - Check if the artist has the necessary data (genres, etc.) for similarity calculation
   - Look for errors in the `calculate-artist-similarities` function logs

### Debugging Tips

- Add more `console.log` statements to the function to trace execution flow
- Test the function directly using the Supabase Dashboard or CLI with a mock payload
- Verify that the function has the necessary permissions to call other edge functions

## Dependencies

- This function depends on the `calculate-artist-similarities` edge function
- It requires the shared CORS headers from `../_shared/cors.ts`
- It needs proper authentication to call other edge functions

## Maintenance

When updating the similarity calculation logic:

1. Make changes to the `calculate-artist-similarities` function
2. This webhook function will automatically use the updated logic
3. No changes are needed to this function unless the payload structure or API changes
