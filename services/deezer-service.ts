import { unstable_cache } from 'next/cache';

interface DeezerArtist {
  artist: {
    id: number;
    name: string;
    link: string;
    picture: string;
    picture_small: string;
    picture_medium: string;
    picture_big: string;
    picture_xl: string;
    nb_album: number;
    nb_fan: number;
    radio: boolean;
    tracklist: string;
    type: string;
  };
}

export class DeezerService {
  private static readonly BASE_URL = 'https://api.deezer.com';

  /**
   * Search for a single artist by name
   * @param artistName The name of the artist to search for
   * @returns The first matching artist or null if not found
   */
  static async getArtist(artistName: string): Promise<DeezerArtist | null> {
    try {
      const response = await fetch(
        `${this.BASE_URL}/search?q=${encodeURIComponent(artistName)}&limit=1&type=artist`
      );
      if (!response.ok) {
        throw new Error(`Deezer API error: ${response.statusText}`);
      }
      const data = await response.json();
      return data.data[0].artist || null;
    } catch (error) {
      console.error('Error fetching Deezer artist:', error);
      return null;
    }
  }


  static async getArtistById(id: string): Promise<DeezerArtist | null> {
    try {
      console.log(`Making request to Deezer API: ${this.BASE_URL}/artist/${id}`);
      const response = await fetch(`${this.BASE_URL}/artist/${id}`);
      
      if (!response.ok) {
        console.error(`Deezer API error: ${response.status} ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      console.log(`Deezer API response for artist ${id}:`, data);
      return data || null;
    } catch (error) {
      console.error('Error fetching Deezer artist by ID:', error);
      return null;
    }
  }

  /**
   * Search for multiple artists by name
   * @param artistNames Array of artist names to search for
   * @returns Array of found artists, maintaining the order of input names
   */ // Inside your DeezerService class
  static getArtistIds = unstable_cache(
    async (artistNames: string[]): Promise<(DeezerArtist | null)[]> => {
      try {
        const promises = artistNames.map(name => this.getArtist(name));
        return await Promise.all(promises);
      } catch (error) {
        console.error('Error fetching multiple Deezer artists:', error);
        return artistNames.map(() => null);
      }
    },
    ['deezer-artist-ids'],
    {
      revalidate: 86400, // Cache for 24 hours (in seconds)
      tags: ['deezer-artists'],
    }
  );
}
/**
 * Convenience function to create an instance of SpotifyService.
 */
export function createDeezerService() {
  return new DeezerService();
}
