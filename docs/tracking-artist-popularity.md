# Tracking Artists Through Time

This guide explains how we track and analyze artists' performance over time across multiple platforms and metrics.

## Understanding Artist Metrics

We track several key metrics across different platforms:

### Spotify Metrics
- **Popularity**: Value between 0-100 representing relative popularity
  - Based on total plays, recent plays, save rates, and playlist additions
  - Updated daily
  - Good indicator of current momentum
- **Followers**: Total number of Spotify followers
  - Direct measure of fan base
  - Cumulative metric

### YouTube Metrics
- **Subscribers**: Total channel subscribers
  - Core audience size
  - Strong indicator of dedicated following
- **Views**: Total channel views
  - Overall reach
  - Historical impact

### Deezer Metrics
- **Followers**: Total number of Deezer fans
  - Platform-specific audience size
  - Market penetration in Deezer-strong regions

## Why Track Multiple Metrics?

Comprehensive tracking allows us to:

1. Identify trends across platforms
2. Measure the impact of releases and events
3. Compare growth trajectories between artists
4. Spot platform-specific opportunities
5. Evaluate marketing campaign effectiveness
6. Understand audience platform preferences
7. Track regional performance variations

## How It Works: The Data Collection Flow

### 1. Automated Collection (Cron Jobs)
- Cron jobs run automatically every day at a set time
- They trigger our data collection function
- Think of it like an automatic daily check-in on your artists

### 2. Data Collection (Edge Function)
- Our function wakes up and collects data from each platform:
  - Spotify: Followers and popularity score
  - YouTube: Subscribers and total views
  - Deezer: Fan count
- It's smart enough to handle errors and retry if needed
- Processes artists in small groups to avoid overloading

### 3. Storage (Database)
- All metrics are saved with:
  - The date they were collected
  - Which platform they came from
  - What type of metric it is
  - The actual value
- No duplicates are allowed for the same day

### 4. Analysis (Time Tracking)
- Now we can see how artists grow over time
- Track things like:
  - Daily/weekly changes
  - Impact of new releases
  - Compare performance across platforms
  - Spot trends and patterns

### Important Notes
- If the cron job or function fails, it will automatically retry
- All historical data is kept, nothing is overwritten
- You can always manually trigger a collection if needed
- Data collection respects each platform's rate limits

## Database Schema

The `artist_metrics` table is designed to track various metrics across different platforms over time:

```sql
CREATE TABLE public.artist_metrics (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  artist_id uuid NULL,
  date date NOT NULL DEFAULT now(),
  platform character varying NOT NULL,
  metric_type character varying NOT NULL,
  value bigint NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT artist_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT artist_metrics_artist_id_date_platform_metric_type_key UNIQUE (artist_id, date, platform, metric_type),
  CONSTRAINT artist_metrics_artist_id_fkey FOREIGN KEY (artist_id) REFERENCES artists(id)
);
```

Key features of this schema:
- `artist_id`: References the main artists table
- `date`: When the metric was recorded
- `platform`: The source platform (e.g., 'spotify', 'youtube', 'deezer')
- `metric_type`: Type of metric being tracked (e.g., 'popularity', 'followers', 'subscribers', 'views')
- `value`: The actual metric value
- Automatic timestamps for creation and updates
- Unique constraint prevents duplicate metrics for the same artist/date/platform/metric combination

## Visualization Strategies

When visualizing metrics over time, consider:

1. **Multi-metric Dashboards**
   - Line graphs for trend analysis
   - Moving averages to smooth fluctuations
   - Side-by-side platform comparisons

2. **Context Annotations**
   - Release dates
   - Tour dates
   - Marketing campaigns
   - Press coverage

3. **Comparative Analysis**
   - Artist-to-artist comparisons
   - Platform-to-platform growth
   - Genre averages
   - Regional variations

## Best Practices

1. **Consistent Collection**
   - Automated daily collection
   - Same time each day
   - Error monitoring and alerts

2. **Data Validation**
   - Range checks
   - Growth rate validation
   - Missing data detection
   - Platform-specific validation rules

3. **Historical Context**
   - Event tracking
   - Market conditions
   - Platform changes
   - Algorithm updates

4. **Data Resilience**
   - Regular backups
   - Historical snapshots
   - API change monitoring
   - Data recovery procedures

5. **Rate Limit Management**
   - Platform-specific limits
   - Batch processing
   - Error handling
   - Retry strategies

## Example Queries

```sql
-- Compare all metrics for an artist across platforms
SELECT 
    platform,
    metric_type,
    date,
    value,
    LAG(value) OVER (PARTITION BY platform, metric_type ORDER BY date) as previous_value,
    value - LAG(value) OVER (PARTITION BY platform, metric_type ORDER BY date) as daily_change
FROM artist_metrics
WHERE artist_id = 'your_artist_id'
    AND date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC, platform, metric_type;

-- Calculate growth rates across platforms
SELECT 
    platform,
    metric_type,
    AVG(daily_growth) as avg_daily_growth,
    MAX(daily_growth) as max_daily_growth
FROM (
    SELECT 
        platform,
        metric_type,
        date,
        ((value::float - LAG(value) OVER (PARTITION BY platform, metric_type ORDER BY date))
         / NULLIF(LAG(value) OVER (PARTITION BY platform, metric_type ORDER BY date), 0) * 100) as daily_growth
    FROM artist_metrics
    WHERE artist_id = 'your_artist_id'
        AND date >= NOW() - INTERVAL '90 days'
) subquery
WHERE daily_growth IS NOT NULL
GROUP BY platform, metric_type;

-- Cross-platform correlation analysis
WITH daily_metrics AS (
    SELECT 
        date,
        MAX(CASE WHEN platform = 'spotify' AND metric_type = 'popularity' THEN value END) as spotify_popularity,
        MAX(CASE WHEN platform = 'youtube' AND metric_type = 'views' THEN value END) as youtube_views
    FROM artist_metrics
    WHERE artist_id = 'your_artist_id'
        AND date >= NOW() - INTERVAL '90 days'
    GROUP BY date
)
SELECT 
    corr(spotify_popularity, youtube_views) as popularity_views_correlation
FROM daily_metrics;
```

## Next Steps

1. **Data Collection**
   - Set up automated collection
   - Implement validation
   - Configure alerts

2. **Analysis Tools**
   - Build visualization dashboards
   - Create automated reports
   - Set up anomaly detection

3. **Integration**
   - Connect with marketing tools
   - Feed into recommendation systems
   - Power artist insights

4. **Expansion**
   - Add new platforms
   - Track more metrics
   - Enhance analysis depth

## Related Topics

- Cross-platform performance analysis
- Audience demographic tracking
- Content performance correlation
- Marketing impact measurement
- Predictive trend modeling
- Regional market analysis 