// This service aggregates data from multiple sources for a full artist record.
import { getArtistInfo } from '@/services/artistInfo-service';  // e.g. extracted from get-info route
import { getViberateData } from '@/services/viberate-service';     // wrap your viberate logic in a function
import { getKworbData } from '@/services/kworb-service';           // wrap your kworb logic similarly

export interface FullArtistData {
  // Define the complete shape you need for addArtistFull.
  artistInfo: any;
  viberateData: any;
  kworbData: any;
}

export async function aggregateArtistData(artistId: string, artistName: string): Promise<FullArtistData> {
  // Execute several scrapers concurrently using Promise.all
  const [artistInfo, viberateData, kworbData] = await Promise.all([
    getArtistInfo(artistName, artistId),      // use your existing get-info functionality
    getViberateData(artistName),              // refactored to return Viberate data
    getKworbData(artistName)                  // refactored to return Kworb data
  ]);

  return {
    artistInfo,
    viberateData,
    kworbData
  };
} 