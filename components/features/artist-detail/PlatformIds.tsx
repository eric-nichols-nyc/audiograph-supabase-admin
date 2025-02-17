import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArtistPlatformId } from './types';

interface PlatformIdsProps {
  platformIds?: ArtistPlatformId[];
}

export function PlatformIds({ platformIds = [] }: PlatformIdsProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Platform IDs</CardTitle>
      </CardHeader>
      <CardContent>
        {platformIds.length > 0 ? (
          <div className="space-y-2">
            {platformIds.map((platform, index) => (
              <div key={platform.id || index} className="flex justify-between items-center p-2 border-b">
                <span className="font-medium capitalize">{platform.platform || 'Unknown Platform'}</span>
                <span className="text-sm text-gray-600">{platform.id || 'N/A'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No platform IDs available</p>
        )}
      </CardContent>
    </Card>
  );
} 