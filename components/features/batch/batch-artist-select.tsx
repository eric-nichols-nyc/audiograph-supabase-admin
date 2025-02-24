'use client';

import { useEffect, useState } from 'react';
import { SpotifyBatchSearch } from '@/components/features/spotify-search/spotify-batch-search';
import { ArtistProgress } from '@/components/features/progress/artist-progress';
import { Button } from '@/components/ui/button';
import { SpotifyArtist } from '@/types/artists';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import { ProgressUpdate } from '@/types/progress';

interface ProcessResult {
  artist: SpotifyArtist;
  success: boolean;
  error?: string;
}

export function BatchArtistSelect() {
  const [selectedArtists, setSelectedArtists] = useState<SpotifyArtist[]>([]);
  const [processingArtists, setProcessingArtists] = useState<Map<string, EventSource>>(new Map());
  const [processingStatuses, setProcessingStatuses] = useState<Map<string, ProgressUpdate>>(new Map());

  // log selected artists in useEffect
  useEffect(() => {
    console.log('Selected artists:', selectedArtists);
  }, [selectedArtists]);

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
      console.log('Processing artist:', artist);

      // First API call - initiates processing
      const response = await fetch('/api/artists/batch-artist-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(artist),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.error || 'Failed to process artist');
      }

      // Second API call - creates EventSource connection to track progress
      const eventSource = new EventSource(`/api/artists/progress/${artist.spotify_id}`);
      setProcessingArtists(prev => new Map(prev).set(artist.spotify_id, eventSource));

      return new Promise<ProcessResult>((resolve) => {
        let hasReceivedUpdate = false;
        const timeout = setTimeout(() => {
          if (!hasReceivedUpdate) {
            eventSource.close();
            resolve({ 
              artist, 
              success: false, 
              error: 'Connection timeout - no updates received' 
            });
          }
        }, 10000); // 10 second timeout

        eventSource.onmessage = (event) => {
          hasReceivedUpdate = true;
          const data = JSON.parse(event.data);
          console.log('Processing status:', data);
          setProcessingStatuses(prev => new Map(prev).set(artist.spotify_id, data));

          if (data.stage === 'COMPLETE' || data.stage === 'ERROR') {
            clearTimeout(timeout);
            eventSource.close();
            setProcessingArtists(prev => {
              const next = new Map(prev);
              next.delete(artist.spotify_id);
              return next;
            });
            resolve({ 
              artist, 
              success: data.stage === 'COMPLETE', 
              error: data.stage === 'ERROR' ? data.details : undefined 
            });
          }
        };

        eventSource.onerror = (error) => {
          clearTimeout(timeout);
          eventSource.close();
          console.error('EventSource error:', error);
          setProcessingStatuses(prev => new Map(prev).set(artist.spotify_id, {
            stage: 'ERROR',
            message: 'Connection Error',
            details: 'Failed to connect to progress updates',
            progress: 0,
          }));
          resolve({ 
            artist, 
            success: false, 
            error: 'Failed to connect to progress updates' 
          });
        };
      });
    } catch (error) {
      console.error(`Error processing artist ${artist.name}:`, error);
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
          return (
            <div key={spotifyId} className="border rounded-lg p-4">
              <div className="font-medium mb-2">
                {selectedArtists.find(a => a.spotify_id === spotifyId)?.name}
              </div>
              {status.stage === 'ERROR' ? (
                <div className="text-destructive">
                  Error: {status.details}
                </div>
              ) : (
                <ArtistProgress status={status} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
} 