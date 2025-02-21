'use client';

import { useState } from 'react';
import { SpotifyBatchSearch } from '@/components/features/spotify-search/spotify-batch-search';
import { ArtistProgress } from '@/components/features/progress/artist-progress';
import { Button } from '@/components/ui/button';
import { SpotifyArtist } from '@/types/artists';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';

interface ProcessResult {
  artist: SpotifyArtist;
  success: boolean;
  error?: string;
}

interface ProcessingStatus {
  stage: string;
  message: string;
  details: string;
  progress: number;
  error?: string;
}

export function BatchArtistSelect() {
  const [selectedArtists, setSelectedArtists] = useState<SpotifyArtist[]>([]);
  const [processingArtists, setProcessingArtists] = useState<Map<string, EventSource>>(new Map());
  const [processingStatuses, setProcessingStatuses] = useState<Map<string, ProcessingStatus>>(new Map());

  const handleArtistSelect = (artist: SpotifyArtist) => {
    if (!selectedArtists.find(a => a.spotify_id === artist.spotify_id)) {
      setSelectedArtists(prev => [...prev, artist]);
    }
  };

  const removeArtist = (spotifyId: string) => {
    setSelectedArtists(prev => prev.filter(a => a.spotify_id !== spotifyId));
  };

  const processArtist = async (artist: SpotifyArtist): Promise<ProcessResult> => {
    try {
      const response = await fetch('/api/artists/get-artist-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artist),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process artist');
      }

      const eventSource = new EventSource('/api/artists/get-artist-full');
      setProcessingArtists(prev => new Map(prev).set(artist.spotify_id, eventSource));

      return new Promise<ProcessResult>((resolve) => {
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          setProcessingStatuses(prev => new Map(prev).set(artist.spotify_id, data));

          if (data.stage === 'COMPLETE' || data.stage === 'ERROR') {
            eventSource.close();
            setProcessingArtists(prev => {
              const next = new Map(prev);
              next.delete(artist.spotify_id);
              return next;
            });
            setSelectedArtists(prev => prev.filter(a => a.spotify_id !== artist.spotify_id));
            resolve({ 
              artist, 
              success: data.stage === 'COMPLETE', 
              error: data.stage === 'ERROR' ? data.details : undefined 
            });
          }
        };

        eventSource.onerror = (error) => {
          eventSource.close();
          setProcessingStatuses(prev => new Map(prev).set(artist.spotify_id, {
            stage: 'ERROR',
            message: 'Processing Error',
            details: 'Connection failed',
            progress: 0,
            error: 'EventSource connection failed'
          }));
          resolve({ 
            artist, 
            success: false, 
            error: 'EventSource connection failed' 
          });
        };
      });
    } catch (error) {
      console.error(`Error processing artist ${artist.name}:`, error);
      setProcessingStatuses(prev => new Map(prev).set(artist.spotify_id, {
        stage: 'ERROR',
        message: 'Processing Error',
        details: error instanceof Error ? error.message : 'Unknown error',
        progress: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
      return { 
        artist, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const processAllArtists = async () => {
    const results = await Promise.allSettled(
      selectedArtists.map(artist => processArtist(artist))
    );

    const successful = results
      .filter((r): r is PromiseFulfilledResult<ProcessResult> => 
        r.status === 'fulfilled' && r.value.success
      )
      .map(r => r.value);

    const failed = results
      .filter((r): r is PromiseFulfilledResult<ProcessResult> | PromiseRejectedResult => 
        r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
      )
      .map(r => r.status === 'fulfilled' ? r.value : {
        artist: r.reason.artist || { name: 'Unknown' },
        success: false,
        error: r.reason.message || 'Unknown error'
      });

    console.log(`Processed ${results.length} artists:`);
    console.log(`- ${successful.length} successful`);
    console.log(`- ${failed.length} failed`);
    
    if (failed.length > 0) {
      console.log('Failed artists:', failed.map(f => ({
        name: f.artist.name,
        error: f.error
      })));
    }
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

      {/* Updated Progress displays */}
      <div className="space-y-4">
        {Array.from(processingStatuses.entries()).map(([spotifyId, status]) => {
          const eventSource = processingArtists.get(spotifyId);
          
          return (
            <div key={spotifyId} className="border rounded-lg p-4">
              <div className="font-medium mb-2">
                {selectedArtists.find(a => a.spotify_id === spotifyId)?.name}
              </div>
              {status.error ? (
                <div className="text-destructive">
                  Error: {status.error}
                </div>
              ) : eventSource ? (
                <ArtistProgress eventSource={eventSource} />
              ) : (
                <div>Initializing...</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 