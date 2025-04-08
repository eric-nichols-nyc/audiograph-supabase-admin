# Kworb Spotify Listeners - Supabase Edge Function

This Supabase Edge Function scrapes Spotify monthly listeners data from Kworb.net and updates artist metrics in the database.

## Functionality

1. Scrapes top artists' monthly listeners data from Kworb.net using Playwright and Bright Data's browser
2. Matches the scraped data with artists in the database using Spotify IDs
3. Inserts new metrics into the `artist_metrics` table

## Environment Variables

The function requires the following environment variables:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `BROWSER_WS` - WebSocket URL for Bright Data's browser (optional, defaults to a predefined value)

## Deployment

To deploy this function to your Supabase project:

```bash
supabase functions deploy kworb-spotify-listeners --no-verify-jwt
```

The `--no-verify-jwt` flag allows the function to run without JWT verification, which is useful for scheduled invocations.

## Scheduling

You can schedule this function to run periodically using Supabase's built-in cron scheduler:

```sql
select
  cron.schedule(
    'kworb-spotify-metrics',
    '0 0 * * *', -- Run at midnight every day
    $$
    select net.http_post(
      'https://your-project-ref.functions.supabase.co/kworb-spotify-listeners',
      '{}',
      '{"Authorization": "Bearer your-service-role-key"}'
    ) as request_id;
    $$
  );
```

## Testing

You can invoke the function manually using:

```bash
curl -i --location --request POST 'https://your-project-ref.functions.supabase.co/kworb-spotify-listeners' \
--header 'Authorization: Bearer your-service-role-key'
```

## Notes

- The function uses Playwright for browser automation
- It connects to Bright Data's browser to handle site scraping
- It operates as an edge function using Deno runtime
- Each successful run inserts new metric entries rather than updating existing ones, to maintain historical data