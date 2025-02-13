import { createMusicBrainzService } from "@/services/music-brainz-service";
import { createYoutubeService } from "@/services/youtube-service";
import { createLastfmService } from "@/services/lastfm-service";
import { createSpotifyService } from "@/services/spotify-service";

export interface ArtistInfo {
  name: string;
  genres: string[];
  country?: string;
  birth_date?: string;
  gender?: string;
  images?: string[];
  youtubeChannelId?: string;
  youtubeViews?: number;
  lastfmBio?: string;
  spotifyId?: string;
  // Add any additional fields as needed.
}

export async function getArtistInfo(artistName: string, artistId: string): Promise<ArtistInfo> {
  const musicBrainzService = createMusicBrainzService();
  const youtubeService = createYoutubeService();
  const lastfmService = createLastfmService();
  const spotifyService = createSpotifyService();

  const [musicBrainz, youtube, lastfm, spotify] = await Promise.allSettled([
    musicBrainzService.getArtist(artistName),
    youtubeService.getArtistYoutubeInfo(artistName),
    lastfmService.getLastFmArtistInfo(artistName),
    spotifyService.getArtistData(artistId),
  ]);

  const info: ArtistInfo = {
    // Use MusicBrainz data as the base
    name: musicBrainz.status === "fulfilled" && musicBrainz.value?.name ? musicBrainz.value.name : artistName,
    genres: musicBrainz.status === "fulfilled" && musicBrainz.value?.genres ? musicBrainz.value.genres : [],
    country: musicBrainz.status === "fulfilled" ? musicBrainz.value?.country : undefined,
    birth_date: musicBrainz.status === "fulfilled" ? musicBrainz.value?.birth_date : undefined,
    gender: musicBrainz.status === "fulfilled" ? musicBrainz.value?.gender : undefined,
    // Use Spotify data for images and ID
    images: spotify.status === "fulfilled" && spotify.value?.images
      ? spotify.value.images.map((img: any) => img.url)
      : [],
    spotifyId: spotify.status === "fulfilled" ? spotify.value?.id : undefined,
    // Use YouTube info if available
    youtubeChannelId: youtube.status === "fulfilled" ? youtube.value?.youtube_channel_id : undefined,
    youtubeViews: youtube.status === "fulfilled" ? youtube.value?.youtube_total_views : undefined,
    // Use Last.fm for bio text
    lastfmBio: lastfm.status === "fulfilled" ? lastfm.value?.bio : "",
  };

  return info;
} 