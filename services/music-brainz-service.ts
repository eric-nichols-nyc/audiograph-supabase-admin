

import 'server-only';
import { unstable_cache } from 'next/cache';
import axios from 'axios';


interface ArtistDetails {
    musicbrainz_id: string;
    name: string;
    country: string | null;
    genres: string[];
    gender: string | null;
    tags?: string[];
    birth_date: string | null;
    death_date: string | null;
  }

export function createMusicBrainzService() {
    return new MusicBrainzService();
}

class MusicBrainzService {
    private api;
    private lastRequestTime: number = 0;

    constructor() {
        this.api = axios.create({
            baseURL: 'https://musicbrainz.org/ws/2',
            headers: {
                'User-Agent': 'ArtistComparisonApp/1.0.0 (ebn646@gmail.com)',
                'Accept': 'application/json'
            }
        });
    }


    private async rateLimitedRequest(url: string, params: any): Promise<any> {
        // Ensure 1 second between requests
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < 1000) {
            await new Promise(resolve => setTimeout(resolve, 1000 - timeSinceLastRequest));
        }

        try {
            const response = await this.api.get(url, { params });
            this.lastRequestTime = Date.now();
            return response.data;
        } catch (error) {
            console.error('MusicBrainz API error:', error);
            throw error;
        }
    }

    public getArtist = unstable_cache(async (artistName: string): Promise<ArtistDetails | null> => {
        try {
          // Search for artist
          const searchData = await this.rateLimitedRequest('/artist', {
            query: artistName,
            fmt: 'json'
          });
    
          if (!searchData.artists?.length) {
            return null;
          }
    
          const artist = searchData.artists[0];
          // Get detailed information
          const detailedData = await this.rateLimitedRequest(`/artist/${artist.id}`, {
            inc: 'genres+url-rels',
            fmt: 'json'
          });
    
          return {
            musicbrainz_id: artist.id,
            name: artist.name,
            country: artist.country || null,
            gender: artist.gender || null,
            genres: (detailedData.genres || []).map((g: { name: string }) => g.name),
            birth_date: artist['life-span']?.begin || null,
            death_date: artist['life-span']?.end || null,
          };
        } catch (error) {
          console.error('Error fetching artist details:', error);
          return null;
        }
      }, ['musicbrainz-artist-details'], { tags: ['musicbrainz-artist-details'], revalidate: 60 * 60 * 24 });
    
}
