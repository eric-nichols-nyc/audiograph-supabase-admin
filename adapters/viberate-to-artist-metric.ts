import { ViberateResponse } from "@/services/viberate-service";
import { ArtistMetric } from "@/types/artists";
import viberateMetricsConfig from "@/config/viberate-metrics-config";

/**
 * Converts a ViberateResponse object to an array of ArtistMetric entries.
 *
 * @param artistId The id of the artist to be associated with the metrics.
 * @param response The raw analytics data from Viberate.
 * @returns An array of ArtistMetric objects formatted for the database.
 */
export function convertViberateResponseToArtistMetrics(
  artistId: string,
  response: ViberateResponse
): ArtistMetric[] {
  const metrics: ArtistMetric[] = [];

  // Loop through each analytics field in the response.
  for (const key in response.artist_analytics) {
    if (response.artist_analytics.hasOwnProperty(key)) {
      const value = response.artist_analytics[key as keyof ViberateResponse["artist_analytics"]];
      if (value === undefined || typeof value !== "number") continue; // Skip undefined or invalid values

      const mappingInfo = viberateMetricsConfig[key as keyof typeof viberateMetricsConfig];
      if (!mappingInfo) continue; // Skip if no mapping is defined

      metrics.push({
        artist_id: artistId,
        platform: mappingInfo.platform,
        metric_type: mappingInfo.metric_type,
        value,
      });
    }
  }

  return metrics;
} 