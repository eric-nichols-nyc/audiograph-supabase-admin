import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Artist } from '@/types/artists';

export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat().format(num);
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}; 

interface ArtistInfoProps {
  artist: Artist;
}

export function ArtistInfo({ artist }: ArtistInfoProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-6">
          <div className="flex-1">
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