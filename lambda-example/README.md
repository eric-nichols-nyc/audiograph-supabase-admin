# Kworb Spotify Listeners Scraper - AWS Lambda

This AWS Lambda function scrapes Spotify monthly listeners data from Kworb and stores it in a Supabase database.

## Deployment Instructions

### 1. Prepare the Lambda package

```bash
# Install dependencies
npm install

# Create a deployment package
zip -r function.zip index.js node_modules package.json
```

### 2. Create the Lambda function in AWS

1. Go to AWS Lambda console
2. Click "Create function"
3. Choose "Author from scratch"
4. Enter a function name (e.g., "kworb-spotify-scraper")
5. Select Node.js runtime (Node.js 18.x recommended)
6. Choose or create an execution role with basic Lambda permissions
7. Click "Create function"
8. Upload the function.zip file

### 3. Configure Lambda settings

1. Set memory: At least 1.5 GB (Playwright requires more memory)
2. Set timeout: 3 minutes
3. Add environment variables:
   - `SUPABASE_URL` - Your Supabase URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `BROWSER_WS` - (Optional) WebSocket URL for external browser service

### 4. Set up CloudWatch Events to run daily

1. In the Designer panel, click "Add trigger"
2. Select "EventBridge (CloudWatch Events)"
3. Select "Create a new rule"
4. Enter a rule name (e.g., "daily-kworb-scrape")
5. For rule type, select "Schedule expression"
6. Enter a cron expression: `cron(0 0 * * ? *)` (runs daily at midnight UTC)
7. Click "Add"

### Monitoring and Troubleshooting

- Check CloudWatch Logs for execution logs
- Monitor Lambda metrics for:
  - Execution duration
  - Memory usage
  - Errors and timeouts

## Notes on Dependencies

This function uses:
- `playwright-aws-lambda` to run a headless browser in AWS Lambda
- `@supabase/supabase-js` to interact with your Supabase database

## Alternative Setup Options

If you encounter issues with Playwright in Lambda, consider:
1. Using an EC2 instance with a cron job
2. Using AWS Fargate with a scheduled task
3. Using BrightData's browser service by setting the BROWSER_WS environment variable 