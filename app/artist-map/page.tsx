'use client';

import React, { useState } from 'react';
import ArtistLocationMap from '@/components/artist-location-map';
import { useArtistLocations } from '@/hooks/useArtistLocations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ArtistMapPage() {
  const [artistSlug, setArtistSlug] = useState<string>('the-weeknd');
  const [inputValue, setInputValue] = useState<string>('the-weeknd');

  const {
    data: locations,
    isLoading,
    error,
    refetch,
  } = useArtistLocations({
    artistSlug,
    enabled: true,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setArtistSlug(inputValue.toLowerCase().trim().replace(/\s+/g, '-'));
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Artist Location Analytics</h1>

      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
          <Input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Enter artist name (e.g. the-weeknd)"
            className="flex-1"
          />
          <Button type="submit">Search</Button>
        </form>
        <p className="text-sm text-gray-500 mt-1">Currently only showing data for "the-weeknd"</p>
      </div>

      <p className="mb-6 text-gray-600">
        This map shows the top locations where{' '}
        {artistSlug
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')}
        's music is being streamed, based on YouTube view data. The size of each marker represents
        the relative number of views from that location.
      </p>

      {isLoading ? (
        <div className="flex justify-center items-center h-[500px] border rounded-lg">
          <p className="text-lg">Loading location data...</p>
        </div>
      ) : error ? (
        <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
          <p className="text-red-500">Error loading location data: {error.message}</p>
          <Button onClick={() => refetch()} className="mt-2">
            Retry
          </Button>
        </div>
      ) : locations && locations.length > 0 ? (
        <ArtistLocationMap
          artistName={artistSlug
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')}
          locations={locations}
        />
      ) : (
        <div className="p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
          <p className="text-yellow-700">No location data available for this artist.</p>
          <p className="text-sm text-yellow-600 mt-1">
            Try searching for "the-weeknd" to see sample data.
          </p>
        </div>
      )}

      {locations && locations.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Raw Data</h2>
          <div className="bg-gray-100 p-4 rounded-lg overflow-auto max-h-96">
            <pre>{JSON.stringify({ artistSlug, topLocations: locations }, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
