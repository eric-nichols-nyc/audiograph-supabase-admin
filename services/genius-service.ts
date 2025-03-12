// services/genius-service.ts
import { unstable_cache } from 'next/cache';


interface GeniusArtist {
  id: number;
  name: string;
  followers_count?: number;
}
interface GeniusArtistResponse {
  meta: {
    status: number;
  };
  response: {
    artist: GeniusArtist;
  };
}

interface GeniusSong {
  id: number;
  title: string;
  url: string;
  primary_artist: GeniusArtist;
}

interface GeniusSearchResponse {
  meta: {
    status: number;
  };
  response: {
    hits: Array<{
      type: string;
      result: GeniusSong;
    }>;
  };
}

export class GeniusService {
  private static readonly BASE_URL = "https://api.genius.com";
  private static readonly ACCESS_TOKEN = process.env.GENIUS_ACCESS_TOKEN;

  private static async fetchFromGenius(endpoint: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url, {
      headers: {
        "User-Agent": "CompuServe Classic/1.22",
        "Accept": "application/json",
        "Authorization": `Bearer ${this.ACCESS_TOKEN}`
      }
    });

    if (!response.ok) {
      throw new Error(`Genius API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get artist ID by name (cached)
   * @param artistName Artist name to search for
   * @returns Artist ID if found, null otherwise
   */
  static getArtistId = unstable_cache(
    async (artistName: string): Promise<number | null> => {
      try {
        const data: GeniusSearchResponse = await this.fetchFromGenius("/search", {
          q: artistName,
          per_page: "5"
        });

        // Find artist in search results with exact name match (case-insensitive)
        const artistResult = data.response.hits.find(hit => 
          hit.result.primary_artist.name.toLowerCase() === artistName.toLowerCase()
        );

        return artistResult ? artistResult.result.primary_artist.id : null;
      } catch (error) {
        console.error(`Error finding artist ID for ${artistName}:`, error);
        return null;
      }
    },
    ['genius-artist-id'],
    { revalidate: 60 * 60 * 24 * 7 } // Cache for 7 days
  );

  /**
   * Get multiple artist IDs by names (cached)
   * @param artistNames Array of artist names
   * @returns Array of artist IDs in the same order as input (null for artists not found)
   */
  static getMultipleArtistIds = unstable_cache(
    async (artistNames: string[]): Promise<(number | null)[]> => {
      try {
        // Create an array of promises for fetching each artist's ID
        const promises = artistNames.map(name => this.getArtistId(name));
        
        // Wait for all promises to resolve
        return await Promise.all(promises);
      } catch (error) {
        console.error("Error fetching multiple artist IDs:", error);
        // Return array of nulls with same length as input
        return artistNames.map(() => null);
      }
    },
    ['genius-multiple-artist-ids'],
    { revalidate: 60 * 60 * 24 * 7 } // Cache for 7 days
  );

  /**
   * Get basic artist info by name (cached)
   * @param artistName Artist name to search for
   * @returns Basic artist info including ID, null if not found
   */
  static getBasicArtistInfo = unstable_cache(
    async (artistName: string): Promise<GeniusArtist | null> => {
      try {
        const data: GeniusSearchResponse = await this.fetchFromGenius("/search", {
          q: artistName,
          per_page: "5"
        });

        // Find artist in search results with exact name match (case-insensitive)
        const artistResult = data.response.hits.find(hit => 
          hit.result.primary_artist.name.toLowerCase() === artistName.toLowerCase()
        );

        return artistResult ? artistResult.result.primary_artist : null;
      } catch (error) {
        console.error(`Error finding artist info for ${artistName}:`, error);
        return null;
      }
    },
    ['genius-basic-artist-info'],
    { revalidate: 60 * 60 * 24 * 7 } // Cache for 7 days
  );

  /**
   * Get basic info for multiple artists by names (cached)
   * @param artistNames Array of artist names
   * @returns Array of basic artist info in the same order as input (null for artists not found)
   */
  static getMultipleArtistsInfo = unstable_cache(
    async (artistNames: string[]): Promise<(GeniusArtist | null)[]> => {
      try {
        // Create an array of promises for fetching each artist's info
        const promises = artistNames.map(name => this.getBasicArtistInfo(name));
        
        // Wait for all promises to resolve
        return await Promise.all(promises);
      } catch (error) {
        console.error("Error fetching multiple artists info:", error);
        // Return array of nulls with same length as input
        return artistNames.map(() => null);
      }
    },
    ['genius-multiple-artists-info'],
    { revalidate: 60 * 60 * 24 * 7 } // Cache for 7 days
  );

  static getArtistById = unstable_cache(
    async (id: string): Promise<(GeniusArtist | null)> => {
      try {
        const data: GeniusArtistResponse = await this.fetchFromGenius(`/artists/${id}`)
        const artist = data.response.artist

         if (!data) {
            return null;
         }

         return artist;
      } catch (error) {
        console.error(`Error finding artist info for ${id}:`, error);
        return null;
      }
    },
    ['genius-multiple-artists-info'],
    { revalidate: 60 * 60 * 24 * 7 } // Cache for 7 days
  );
}