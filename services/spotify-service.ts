import 'server-only';

import { SpotifyArtist } from "@/types/artists";
import { unstable_cache } from 'next/cache';


export class SpotifyService {
    // Helper function to get an access token from Spotify using the Client Credentials flow.
private getAccessToken = unstable_cache(
    async (): Promise<string> => {
        const clientId = process.env.NEXT_PUBLIC_SPOTIFY_ID;
        const clientSecret = process.env.NEXT_PUBLIC_SPOTIFY_SECRET;

        if (!clientId || !clientSecret) {
            throw new Error('Spotify client ID or secret is not set in environment variables');
        }
        
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch access token: ${response.statusText}`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error('Access token not found in response');
        }

        return data.access_token;
    },
    ['spotify-access-token'],
    { tags: ['spotify-access-token'], revalidate: 3600 } // Cache for 1 hour
);
  /**
   * Searches for artists in Spotify given a query string.
   */
 
  public searchArtist = unstable_cache(async (artistName: string) => {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    const data = await response.json();
    if (!data.artists?.items?.length) {
        throw new Error('Artist not found');
    }
    console.log('searchArtist = ', data.artists.items[0])

    const artist_id = data.artists.items[0].id;

    const artistResponse = await fetch(
        `https://api.spotify.com/v1/artists/${artist_id}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    const artistData = await artistResponse.json();
    console.log('artistData ==================?????= ', artistData)
    
    return artist_id;

},['spotify-search-artist'], { tags: ['spotify-search-artist'], revalidate: 60 * 60 * 24 });


  public getArtistData = unstable_cache(async (artist_id: string) => {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artist_id}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    const data = await response.json();
    console.log('data ==================?????= ', data)

    return data;
  }, ['spotify-artist-data'], { tags: ['spotify-artist-data'], revalidate: 60 * 60 * 24 });
}



/**
 * Convenience function to create an instance of SpotifyService.
 */
export function createSpotifyService() {
  return new SpotifyService();
} 