| table_name          | column_name          | data_type                | is_nullable |
| ------------------- | -------------------- | ------------------------ | ----------- |
| accounts            | user_id              | uuid                     | NO          |
| accounts            | email                | text                     | NO          |
| accounts            | created_at           | timestamp with time zone | YES         |
| artist_articles     | id                   | uuid                     | NO          |
| artist_articles     | artist_id            | uuid                     | YES         |
| artist_articles     | title                | text                     | NO          |
| artist_articles     | content              | text                     | NO          |
| artist_articles     | url                  | text                     | YES         |
| artist_articles     | source               | character varying        | NO          |
| artist_articles     | published_date       | timestamp with time zone | YES         |
| artist_articles     | embedding            | USER-DEFINED             | YES         |
| artist_articles     | sentiment_score      | double precision         | YES         |
| artist_articles     | metadata             | jsonb                    | YES         |
| artist_articles     | created_at           | timestamp with time zone | YES         |
| artist_metrics      | id                   | uuid                     | NO          |
| artist_metrics      | artist_id            | uuid                     | YES         |
| artist_metrics      | date                 | date                     | NO          |
| artist_metrics      | platform             | character varying        | NO          |
| artist_metrics      | metric_type          | character varying        | NO          |
| artist_metrics      | value                | bigint                   | NO          |
| artist_metrics      | created_at           | timestamp with time zone | YES         |
| artist_metrics      | updated_at           | timestamp with time zone | YES         |
| artist_platform_ids | artist_id            | uuid                     | NO          |
| artist_platform_ids | platform             | character varying        | NO          |
| artist_platform_ids | platform_id          | character varying        | NO          |
| artist_platform_ids | created_at           | timestamp with time zone | YES         |
| artist_tracks       | id                   | uuid                     | NO          |
| artist_tracks       | artist_id            | uuid                     | YES         |
| artist_tracks       | track_id             | character varying        | NO          |
| artist_tracks       | created_at           | timestamp with time zone | YES         |
| artist_urls         | artist_id            | uuid                     | NO          |
| artist_urls         | platform             | character varying        | NO          |
| artist_urls         | url                  | text                     | NO          |
| artist_urls         | created_at           | timestamp with time zone | YES         |
| artist_videos       | id                   | uuid                     | NO          |
| artist_videos       | artist_id            | uuid                     | YES         |
| artist_videos       | video_id             | character varying        | NO          |
| artist_videos       | created_at           | timestamp with time zone | YES         |
| artist_videos       | role                 | text                     | YES         |
| artists             | id                   | uuid                     | NO          |
| artists             | name                 | character varying        | YES         |
| artists             | slug                 | character varying        | NO          |
| artists             | rank                 | integer                  | YES         |
| artists             | rank_change          | integer                  | YES         |
| artists             | last_rank_update     | timestamp with time zone | YES         |
| artists             | bio                  | text                     | YES         |
| artists             | gender               | character varying        | YES         |
| artists             | country              | character varying        | YES         |
| artists             | birth_date           | date                     | YES         |
| artists             | image_url            | text                     | YES         |
| artists             | created_at           | timestamp with time zone | YES         |
| artists             | updated_at           | timestamp with time zone | YES         |
| artists             | is_complete          | boolean                  | YES         |
| artists             | genres               | ARRAY                    | YES         |
| debug_logs          | id                   | integer                  | NO          |
| debug_logs          | timestamp            | timestamp with time zone | YES         |
| debug_logs          | event                | text                     | YES         |
| debug_logs          | details              | jsonb                    | YES         |
| notifications       | id                   | uuid                     | NO          |
| notifications       | account_id           | uuid                     | NO          |
| notifications       | title                | character varying        | NO          |
| notifications       | message              | text                     | NO          |
| notifications       | type                 | character varying        | NO          |
| notifications       | link                 | character varying        | YES         |
| notifications       | is_read              | boolean                  | YES         |
| notifications       | created_at           | timestamp with time zone | YES         |
| notifications       | read_at              | timestamp with time zone | YES         |
| notifications       | expires_at           | timestamp with time zone | YES         |
| notifications       | metadata             | jsonb                    | YES         |
| notifications       | priority             | smallint                 | YES         |
| tracks              | id                   | uuid                     | NO          |
| tracks              | title                | character varying        | NO          |
| tracks              | track_id             | text                     | NO          |
| tracks              | platform             | text                     | YES         |
| tracks              | url                  | character varying        | YES         |
| tracks              | thumbnail_url        | character varying        | YES         |
| tracks              | popularity           | integer                  | YES         |
| tracks              | stream_count_total   | bigint                   | YES         |
| tracks              | stream_count_monthly | bigint                   | YES         |
| tracks              | position_peak        | integer                  | YES         |
| tracks              | release_date         | date                     | YES         |
| tracks              | created_at           | timestamp with time zone | YES         |
| tracks              | updated_at           | timestamp with time zone | YES         |
| tracks              | metadata             | jsonb                    | YES         |
| videos              | id                   | uuid                     | NO          |
| videos              | title                | character varying        | NO          |
| videos              | video_id             | text                     | YES         |
| videos              | platform             | character varying        | NO          |
| videos              | thumbnail_url        | character varying        | YES         |
| videos              | view_count           | bigint                   | YES         |
| videos              | view_count_monthly   | bigint                   | YES         |
| videos              | published_at         | timestamp with time zone | YES         |
| videos              | created_at           | timestamp with time zone | YES         |
| videos              | updated_at           | timestamp with time zone | YES         |
| videos              | metadata             | jsonb                    | YES         |
| videos              | view_count_daily     | bigint                   | YES         |
| videos              | isCollaboration      | boolean                  | YES         |