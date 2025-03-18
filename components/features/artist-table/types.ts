import { Artist } from '@/types/artists'

// Extended Artist interface with metrics data
export interface ArtistWithMetrics extends Artist {
    youtube_subscribers: number | null;
    spotify_popularity: number | null;
}
