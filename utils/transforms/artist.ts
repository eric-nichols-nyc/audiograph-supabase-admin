import type { Artist, Video, Track, ArtistPlatformId, ArtistUrl, ArtistMetric } from '@/types/artists';

interface ArtistResponse extends Omit<Artist, 'artist_videos' | 'artist_tracks'> {
  id: string;
  artist_platform_ids: ArtistPlatformId[];
  artist_urls: ArtistUrl[];
  artist_metrics: ArtistMetric[];
  artist_videos: { videos: Video }[];
  artist_tracks: { tracks: Track }[];
}

interface TransformedArtist extends Omit<ArtistResponse, 'artist_videos' | 'artist_tracks'> {
  id: string;
  artist: Artist;
  artist_videos: Video[];
  artist_tracks: Track[];
}

export function transformArtistResponse(artist: ArtistResponse): TransformedArtist {
  if (!artist.id) {
    throw new Error('Artist ID is required');
  }

  return {
    ...artist,
    artist: artist,
    artist_videos: artist.artist_videos?.map(item => item.videos) || [],
    artist_tracks: artist.artist_tracks?.map(item => item.tracks) || []
  };
} 