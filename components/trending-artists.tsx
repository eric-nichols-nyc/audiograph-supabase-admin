'use client';

import { useEffect, useState } from 'react';
import { Artist } from '@/types/artists';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TrendingArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);

  useEffect(() => {
    const fetchTrendingArtists = async () => {
      const response = await fetch('/api/artists/trending');
      const data = await response.json();
      setArtists(data);
    };

    fetchTrendingArtists();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Artists</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {artists.map((artist) => (
            <Link 
              key={artist.id} 
              href={`/artists/${artist.slug}`}
              className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded"
            >
              <span className="font-bold w-8">#{artist.rank}</span>
              <img 
                src={artist.image_url || ''} 
                alt={artist.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <div className="font-semibold">{artist.name}</div>
                {artist.rank_change && (
                  <span className={`text-sm ${
                    artist.rank_change > 0 
                      ? 'text-green-500' 
                      : artist.rank_change < 0 
                        ? 'text-red-500' 
                        : 'text-gray-500'
                  }`}>
                    {artist.rank_change > 0 ? '↑' : artist.rank_change < 0 ? '↓' : '→'}
                    {Math.abs(artist.rank_change)}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 