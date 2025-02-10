import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';


export interface LastFmArtistInfo {
  name: string;
  musicbrainz_id: string;
  lfmUrl: string;
  lastfm_monthly_listeners: string;
  lastfm_play_count: string;
  bio: string;
}


const LASTFM_API_KEY = process.env.NEXT_PUBLIC_LASTFM_API_KEY;

export function createLastfmService() {
  return new LastfmService();
}

class LastfmService {
  constructor() {}

  public getLastFmArtistInfo = unstable_cache(async (artistName: string): Promise<LastFmArtistInfo> => {
    try {
      const response = await fetch(
        `http://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(artistName)}&api_key=${LASTFM_API_KEY}&format=json`
      );
      const data = await response.json();
  
      const fromattedArtist = {
        name: data.artist.name,
        musicbrainz_id: data.artist.mbid,
        lfmUrl: data.artist.url,
        lastfm_monthly_listeners: data.artist.stats.listeners,
        lastfm_play_count: data.artist.stats.playcount,
        bio: data.artist.bio.summary,
      }
      return fromattedArtist;
    } catch (error) {
      console.error('Error fetching Last.fm artist info:', error);
      throw error;
    }
  }, ['lastfm-artist-info'], { tags: ['lastfm-artist-info'], revalidate: 60 * 60 * 24 });
  
}
