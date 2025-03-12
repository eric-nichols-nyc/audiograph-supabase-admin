'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocationData } from '@/utils/location-data';
import dynamic from 'next/dynamic';

// Interface for component props
interface ArtistLocationMapProps {
  artistName: string;
  locations: LocationData[];
}

// Function to extract numeric value from views string
const extractViewsValue = (views: string): number => {
  const match = views.match(/(\d+(\.\d+)?)([KM])?/);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[3];

  if (unit === 'M') return value * 1000000;
  if (unit === 'K') return value * 1000;
  return value;
};

// Dynamically import the Map component with no SSR
const MapWithNoSSR = dynamic(() => import('./map-component'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex items-center justify-center bg-gray-100 rounded-md">
      <p>Loading map...</p>
    </div>
  ),
});

const ArtistLocationMap: React.FC<ArtistLocationMapProps> = ({ artistName, locations }) => {
  // Calculate max views for scaling marker sizes
  const maxViews = Math.max(...locations.map(loc => extractViewsValue(loc.views)));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{artistName}'s Top Listener Locations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] w-full rounded-md overflow-hidden">
          <MapWithNoSSR locations={locations} maxViews={maxViews} />
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {locations.slice(0, 6).map((location, index) => (
            <div key={index} className="flex items-center p-2 border rounded">
              <div className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full mr-2">
                {location.rank}
              </div>
              <div>
                <div className="font-medium">{location.title}</div>
                <div className="text-sm text-gray-500">{location.views}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ArtistLocationMap;
