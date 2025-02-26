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
    return artist_id;

},['spotify-search-artist'], { tags: ['spotify-search-artist'], revalidate: 60 * 60 * 24 });
 
public getArtist = unstable_cache(async (artistName: string) => {
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
    console.log('======== artistData', artistData);
    return artistData;

},['spotify-search-artist'], { tags: ['spotify-search-artist'], revalidate: 60 * 60 * 24 });

// 
// Returns the artist data from Spotify using the artist spotify id
  public getArtistData = unstable_cache(async (spotify_id: string) => {
    const accessToken = await this.getAccessToken();
    
    const response = await fetch(
        `https://api.spotify.com/v1/artists/${spotify_id}`,
        {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        }
    );

    const data = await response.json();

    return data;
  }, ['spotify-artist-data'], { tags: ['spotify-artist-data'], revalidate: 60 * 60 * 24 });

  // Returns the tracks from Spotify using the track ids
    public getTracks = unstable_cache(
        async (trackIds: string[]) => {
            const accessToken = await this.getAccessToken();
            
            const response = await fetch(
                `https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            const data = await response.json();
            return data.tracks || [];
        },
        ['spotify-tracks'],
        { tags: ['spotify-tracks'], revalidate: 60 * 60 * 24 }
    );

    public getTrackImage = unstable_cache(
        async (trackId: string) => {
            const accessToken = await this.getAccessToken();
            
            const response = await fetch(
                `https://api.spotify.com/v1/tracks/${trackId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            const data = await response.json();
            return data.album.images[0].url;
        },
        ['spotify-track-image'],
        { tags: ['spotify-track-image'], revalidate: 60 * 60 * 24 }
    );

    // Returns the track data from Spotify using the track id
    public getTrackData = unstable_cache(
        async (trackId: string) => {
            const accessToken = await this.getAccessToken();
            
            const response = await fetch(
                `https://api.spotify.com/v1/tracks/${trackId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                }
            );

            const data = await response.json();
            return data;
        },
        ['spotify-track-data'],
        { tags: ['spotify-track-data'], revalidate: 60 * 60 * 24 }
    );
    
}



interface Images {
    id: string;
    url: string;
}

interface Track {
    id: string;
    name: string;
    popularity: number;
}

export const convertSpotifyTracksTrackType = (tracks: Track[],images: Images[]) => {
    return tracks.map((track) => ({
       ...track,
       thumbnail_url: images.find((image) => image.id === track.id)?.url  
    }));
}






/**
 * Convenience function to create an instance of SpotifyService.
 */
export function createSpotifyService() {
  return new SpotifyService();
} 