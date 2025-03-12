// Types for location data
export interface LocationData {
  rank: string;
  title: string;
  views: string;
}

export interface LocationResponse {
  success: boolean;
  timestamp: string;
  artistSlug: string;
  topLocations: LocationData[];
}

// City coordinates mapping (approximate)
export const CITY_COORDINATES: Record<string, [number, number]> = {
  'Mexico City': [-99.1332, 19.4326],
  Jakarta: [106.8456, -6.2088],
  Lima: [-77.0428, -12.0464],
  Santiago: [-70.6693, -33.4489],
  'São Paulo': [-46.6333, -23.5505],
  London: [-0.1278, 51.5074],
  Bangkok: [100.5018, 13.7563],
  'Kuala Lumpur': [101.6869, 3.139],
  Bogotá: [-74.0721, 4.711],
  İstanbul: [28.9784, 41.0082],
  'New York': [-74.006, 40.7128],
  Seoul: [126.978, 37.5665],
  Paris: [2.3522, 48.8566],
  'Buenos Aires': [-58.3816, -34.6037],
  Milan: [9.19, 45.4642],
  // Add more cities as needed
};

// Function to extract numeric value from views string
export const extractViewsValue = (views: string): number => {
  const match = views.match(/(\d+(\.\d+)?)([KM])?/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[3];

  if (unit === 'M') return value * 1000000;
  if (unit === 'K') return value * 1000;
  return value;
};

// Function to format location data for the map
export const formatLocationDataForMap = (locations: LocationData[]) => {
  if (!locations || locations.length === 0) return [];

  // Get max views for scaling
  const viewsValues = locations.map(loc => extractViewsValue(loc.views));
  const maxViews = Math.max(...viewsValues);

  return locations
    .map(location => {
      const coordinates = CITY_COORDINATES[location.title];
      if (!coordinates) return null;

      const viewsValue = extractViewsValue(location.views);
      // Scale marker size between 5 and 20 based on views
      const size = 5 + (viewsValue / maxViews) * 15;

      return {
        coordinates,
        size,
        rank: location.rank,
        title: location.title,
        views: location.views,
      };
    })
    .filter(Boolean);
};
