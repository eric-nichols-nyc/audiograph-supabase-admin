import { NextResponse } from "next/server";
import { createMusicBrainzService } from "@/services/music-brainz-service";
import { createYoutubeService } from "@/services/youtube-service";
import { createLastfmService } from "@/services/lastfm-service";
import { createSpotifyService } from "@/services/spotify-service";
import { unstable_cache } from "next/cache";
import { GeminiService } from "@/services/gemini-service";
import { createSlug } from "@/utils/slugify";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artistName = searchParams.get('artistName');
  const artistId = searchParams.get('artistId');

  if (!artistName) {
    return NextResponse.json({ error: 'Artist name is required' }, { status: 400 });
  }
  if (!artistId) {
    return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
  }

  const fetchArtistInfo = unstable_cache(async (artistName: string) => {
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


    return {
      musicBrainz,
      youtube,
      lastfm,
      spotify,
    };
  }, [artistName]);

  const rawData = await fetchArtistInfo(artistName);

  // Determine bio: use Last.fm if available, otherwise use Gemini to generate one.
  let bioText = rawData.lastfm.status === 'fulfilled' ? rawData.lastfm?.value?.bio : "";
  if (!bioText) {
    const geminiService = new GeminiService();
    // Construct an ArtistBioInfo from MusicBrainz data (or fallback to artistName)
    const artistInfo = {
      name: rawData.spotify.status === 'fulfilled' ? rawData.spotify?.value?.name : artistName,
      genres: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.genres : [],
      country: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.country : null,
      gender: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.gender : null,
      birth_date: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.birth_date : null,
    };
    bioText = await geminiService.generateArtistBio(artistInfo, 'full');
  }

  // Transform the raw response into the shape required by addArtistFull:
  const transformed = {
    artist: {
      name: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.name : "",
      image_url: rawData.spotify.status === 'fulfilled' ? rawData.spotify?.value?.images[1].url : "",
      country: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.country : "",
      gender: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.gender : "",
      birth_date: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.birth_date : "",
      genres: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.genres : [],
      is_completed: false,
      bio: bioText,
      slug: createSlug(artistName),
      rank: null,
      rank_change: null,
      last_rank_update: null,
    },
    platformData: [{
      platform: "youtube",
      platform_id: rawData.youtube.status === 'fulfilled' ? rawData.youtube.value.youtube_channel_id : ""
    },
    {
      platform: "musicbrainz",
      platform_id: rawData.musicBrainz.status === 'fulfilled' ? rawData.musicBrainz?.value?.musicbrainz_id : ""
    },
    {
      platform: "spotify",
      platform_id: rawData.spotify.status === 'fulfilled' ? rawData.spotify?.value?.id : ""
    }
    ], 
    urlData: [{
      platform: "lastfm",
      url: rawData.lastfm.status === 'fulfilled' ? rawData.lastfm.value.lfmUrl : "",
    }],
    metricData: [
      {
        date: new Date().toISOString(),
        platform: "youtube",
        metric_type: "views",
        value: rawData.youtube.status === 'fulfilled' ? rawData.youtube.value.youtube_total_views : 0,
      },
      {
        date: new Date().toISOString(),
        platform: "youtube",
        metric_type: "subscribers",
        value: rawData.youtube.status === 'fulfilled' ? rawData.youtube.value.youtube_subcribers : 0,
      },
      {
        date: new Date().toISOString(),
        platform: "lastfm",
        metric_type: "monthly_listeners",
        value: rawData.lastfm.status === 'fulfilled' ? Number(rawData.lastfm.value.lastfm_monthly_listeners) : 0,
      },
      {
        date: new Date().toISOString(),
        platform: "lastfm",
        metric_type: "play_count",
        value: rawData.lastfm.status === 'fulfilled' ? Number(rawData.lastfm.value.lastfm_play_count) : 0,
      }
    ]
  };

  return NextResponse.json(transformed);
}
