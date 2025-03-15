# Scheduled Artist Similarity Calculation

This Edge Function is designed to be run on a schedule to automatically calculate similarities between all artists in the database.

## Overview

The `scheduled-calculate-similarities` function:

1. Is triggered automatically according to a configured schedule
2. Uses the Supabase service role key for admin access
3. Invokes the `calculate-artist-similarities` function with a high limit to process all artists
4. Logs the results for monitoring

## Implementation Details

The function:
- Uses the service role key to ensure it has sufficient permissions
- Sets a limit higher than the total number of artists (50 for ~29 artists)
- Includes error handling and logging

## Deployment

Deploy the function using the Supabase CLI:

```bash
supabase functions deploy scheduled-calculate-similarities
```

## Setting Up the Schedule

Set up a cron schedule using the Supabase CLI:

```bash
supabase functions schedule create --function-name scheduled-calculate-similarities --schedule "0 0 * * *" --name daily-similarity-calculation
```

Common cron schedules:
- `0 0 * * *` - Daily at midnight
- `0 0 * * 0` - Weekly on Sunday
- `0 0 1 * *` - Monthly on the 1st

## Required Secrets

The function requires the service role key to be set as a secret:

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find your service role key in the Supabase dashboard under Project Settings > API.

## Monitoring

You can monitor the execution of the scheduled job in the Supabase dashboard:

1. View logs: `supabase functions logs scheduled-calculate-similarities`
2. Check the schedule status in the dashboard under Functions > Scheduled Functions

## Troubleshooting

If the scheduled job fails:

1. Check that the service role key is correctly set
2. Verify that the `calculate-artist-similarities` function is deployed and working
3. Ensure the function has sufficient permissions to access the database

## Related Documentation

See the [calculate-artist-similarities README](../calculate-artist-similarities/README.md) for more details on how the similarity calculation works.
