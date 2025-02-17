import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Artist, formatDate } from './types';

interface BasicInfoProps {
  artist: Artist;
}

export function BasicInfo({ artist }: BasicInfoProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-gray-100">
            {artist.image_url ? (
              <img
                src={artist.image_url}
                alt={artist.name || 'Artist'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{artist.name || 'Unknown Artist'}</h2>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Country:</span> {artist.country || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Gender:</span> {artist.gender || 'N/A'}
              </p>
              <p>
                <span className="font-medium">Birth Date:</span> {formatDate(artist.birth_date)}
              </p>
              <p>
                <span className="font-medium">Genres:</span>{' '}
                {Array.isArray(artist.genres) ? artist.genres.join(', ') : 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-gray-700">{artist.bio || 'No biography available'}</p>
        </div>
      </CardContent>
    </Card>
  );
} 