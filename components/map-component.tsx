'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationData } from '@/utils/location-data';
import { CITY_COORDINATES } from '@/utils/location-data';

// Fix for Leaflet marker icons in Next.js
import L from 'leaflet';

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

interface MapComponentProps {
  locations: LocationData[];
  maxViews: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ locations, maxViews }) => {
  useEffect(() => {
    // Fix for Leaflet default icon issue in Next.js
    (async function init() {
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    })();
  }, []);

  // Filter locations that have coordinates
  const markersWithCoordinates = locations
    .map(location => {
      const coordinates = CITY_COORDINATES[location.title];
      if (!coordinates) return null;

      const viewsValue = extractViewsValue(location.views);
      // Scale marker size between 5 and 25 based on views
      const size = 5 + (viewsValue / maxViews) * 20;

      return {
        coordinates: [coordinates[1], coordinates[0]] as [number, number], // Leaflet uses [lat, lng]
        size,
        rank: location.rank,
        title: location.title,
        views: location.views,
      };
    })
    .filter(Boolean);

  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {markersWithCoordinates.map((marker, index) => (
        <CircleMarker
          key={index}
          center={marker.coordinates}
          radius={marker.size}
          pathOptions={{
            fillColor: '#FF4136',
            color: '#FFFFFF',
            weight: 1,
            fillOpacity: 0.8,
          }}
        >
          <Popup>
            <div className="text-center">
              <div className="font-bold">
                #{marker.rank}: {marker.title}
              </div>
              <div>{marker.views}</div>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
