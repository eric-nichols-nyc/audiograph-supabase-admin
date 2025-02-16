import { createMusicBrainzService } from "@/services/music-brainz-service";
import { createYoutubeService } from "@/services/youtube-service";
import { createLastfmService } from "@/services/lastfm-service";
import { createSpotifyService } from "@/services/spotify-service";
import { Artist } from "@/types/artists";
import { createSlug } from "@/utils/slugify";
import { GeminiService } from "@/services/gemini-service";



export async function getArtistInfo(artistName: string, artistId: string): Promise<{ artist: Artist, platformData: any[], urlData: any[], metricData: any[] }> {
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

  // console.log('artistinfo service musicBrainz', musicBrainz)
  // console.log('artistinfo service youtube', youtube)
  // console.log('artistinfo service lastfm', lastfm)
  // console.log('artistinfo service spotify', spotify)

  // Extract and validate the country value from MusicBrainz data.
  const country = musicBrainz.status === "fulfilled" ? (musicBrainz.value?.country ?? null) : null;
  if (country === null) {
    throw new Error(
      `Validation Error: Artist country is missing for "${artistName}". Please update the artist's country before adding to the database.`
    );
  }

  // Determine bio: use Last.fm if available, otherwise generate bio using Gemini.
  let bioText = lastfm.status === 'fulfilled' ? lastfm.value?.bio : "";
  if (!bioText) {
    const geminiService = new GeminiService();
    const artistForBio = {
      name: spotify.status === 'fulfilled' && spotify.value?.name ? spotify.value.name : artistName,
      genres: musicBrainz.status === 'fulfilled' && musicBrainz.value?.genres ? musicBrainz.value.genres : [],
      country: country,
      gender: musicBrainz.status === 'fulfilled' ? (musicBrainz.value?.gender ?? null) : null,
      birth_date: musicBrainz.status === 'fulfilled' ? (musicBrainz.value?.birth_date ?? null) : null,
    };
    bioText = await geminiService.generateArtistBio(artistForBio, 'full');
  }

  const info: Artist = {
    name:
      musicBrainz.status === 'fulfilled' && musicBrainz.value?.name
        ? musicBrainz.value.name
        : artistName,
    image_url:
      spotify.status === 'fulfilled' && spotify.value?.images
        ? spotify.value.images[0].url
        : null,
    country: country,
    gender:
      musicBrainz.status === 'fulfilled'
        ? (musicBrainz.value?.gender ?? null)
        : null,
    birth_date:
      musicBrainz.status === 'fulfilled'
        ? (musicBrainz.value?.birth_date ?? null)
        : null,
    genres:
      musicBrainz.status === 'fulfilled' && musicBrainz.value?.genres
        ? musicBrainz.value.genres
        : [],
    is_complete: false,
    bio: bioText,
    slug: createSlug(artistName),
    rank: null,
    rank_change: null,
    last_rank_update: null,
  };

  // Build additional data arrays as per the API route's transformation.
  const currentDate = new Date().toISOString();
  const platformData = [
    {
      platform: "youtube",
      platform_id: youtube.status === 'fulfilled' ? youtube.value?.youtube_channel_id : ""
    },
    {
      platform: "musicbrainz",
      platform_id: musicBrainz.status === 'fulfilled' ? musicBrainz.value?.musicbrainz_id : ""
    },
    {
      platform: "spotify",
      platform_id: spotify.status === 'fulfilled' ? spotify.value?.id : ""
    }
  ];

  const urlData = [
    {
      artist_id: "",
      platform: "lastfm",
      url: lastfm.status === 'fulfilled' ? lastfm.value?.lfmUrl : "",
      created_at: new Date().toISOString()
    }
  ];

  const metricData = [
    {
      date: currentDate,
      platform: "youtube",
      metric_type: "views",
      value: youtube.status === 'fulfilled' ? youtube.value?.youtube_total_views : 0
    },
    {
      date: currentDate,
      platform: "youtube",
      metric_type: "subscribers",
      value: youtube.status === 'fulfilled' ? youtube.value?.youtube_subcribers : 0
    },
    {
      date: currentDate,
      platform: "lastfm",
      metric_type: "monthly_listeners",
      value: lastfm.status === 'fulfilled' ? Number(lastfm.value?.lastfm_monthly_listeners) : 0
    },
    {
      date: currentDate,
      platform: "lastfm",
      metric_type: "play_count",
      value: lastfm.status === 'fulfilled' ? Number(lastfm.value?.lastfm_play_count) : 0
    }
  ];

  return { artist: info, platformData, urlData, metricData };
} 