// app/admin/artists/add/page.tsx
'use client';

import { useState } from 'react';
import { SpotifySearch } from '@/components/features/spotify-search/spotify-search';
import { ArtistProgress } from '@/components/features/progress/artist-progress';
import { Button } from '@/components/ui/button';
import { SpotifyArtist } from '@/types/artists';

export function AddArtist() {
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  const handleArtistSelect = (artist: SpotifyArtist) => {
    setSelectedArtist(artist);
  };

  const handleAddArtist = async () => {
    if (!selectedArtist) return;

    // Close any existing event source
    if (eventSource) {
      eventSource.close();
    }

    try {
      const response = await fetch('/api/artists/get-artist-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedArtist),
      });

      if (response.ok) {
        const newEventSource = new EventSource('/api/artists/get-artist-full');
        setEventSource(newEventSource);
      } else {
        console.error('Failed to start artist ingestion');
      }
    } catch (error) {
      console.error('Error starting artist ingestion:', error);
    }
  };

  return (
    <div className="space-y-8">
      <SpotifySearch onArtistSelect={handleArtistSelect} />
      
      {selectedArtist && (
        <div className="flex flex-col items-center gap-4">
          <Button 
            onClick={handleAddArtist}
            disabled={!!eventSource}
          >
            Add {selectedArtist.name}
          </Button>
        </div>
      )}

      {eventSource && <ArtistProgress eventSource={eventSource} />}
    </div>
  );
}