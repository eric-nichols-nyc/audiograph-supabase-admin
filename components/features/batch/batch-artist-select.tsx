'use client';

import { useState } from 'react';
import { SpotifyBatchSearch } from '@/components/features/spotify-search/spotify-batch-search';
import { ArtistProgress } from '@/components/features/progress/artist-progress';
import { Button } from '@/components/ui/button';
import { SpotifyArtist } from '@/types/artists';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

export function BatchArtistSelect() {
  const [selectedArtists, setSelectedArtists] = useState<SpotifyArtist[]>([]);
  const [processingArtists, setProcessingArtists] = useState<Map<string, EventSource>>(new Map());

  const handleArtistSelect = (artist: SpotifyArtist) => {
    if (!selectedArtists.find(a => a.spotify_id === artist.spotify_id)) {
      setSelectedArtists(prev => [...prev, artist]);
    }
  };

  const removeArtist = (spotifyId: string) => {
    setSelectedArtists(prev => prev.filter(a => a.spotify_id !== spotifyId));
  };

  const processArtist = async (artist: SpotifyArtist) => {
    try {
      const response = await fetch('/api/artists/get-artist-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artist),
      });

      if (response.ok) {
        const eventSource = new EventSource('/api/artists/get-artist-full');
        setProcessingArtists(prev => new Map(prev).set(artist.spotify_id, eventSource));

        // Remove artist and close EventSource when complete
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.stage === 'COMPLETE' || data.stage === 'ERROR') {
            eventSource.close();
            setProcessingArtists(prev => {
              const next = new Map(prev);
              next.delete(artist.spotify_id);
              return next;
            });
            setSelectedArtists(prev => prev.filter(a => a.spotify_id !== artist.spotify_id));
          }
        };
      }
    } catch (error) {
      console.error('Error processing artist:', error);
    }
  };

  const processAllArtists = () => {
    selectedArtists.forEach(artist => processArtist(artist));
  };

  return (
    <div className="space-y-6">
      <SpotifyBatchSearch 
        onArtistSelect={handleArtistSelect} 
        selectedArtists={selectedArtists}
        clearOnSelect={false}
      />

      {selectedArtists.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Selected Artists ({selectedArtists.length})</h3>
            <Button onClick={processAllArtists}>Process All</Button>
          </div>

          <ScrollArea className="h-[200px] border rounded-md p-4">
            <div className="space-y-2">
              {selectedArtists.map(artist => (
                <div key={artist.spotify_id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                  <span>{artist.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => removeArtist(artist.spotify_id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Progress displays */}
      <div className="space-y-4">
        {Array.from(processingArtists.entries()).map(([spotifyId, eventSource]) => (
          <div key={spotifyId} className="border rounded-lg p-4">
            <ArtistProgress eventSource={eventSource} />
          </div>
        ))}
      </div>
    </div>
  );
} 