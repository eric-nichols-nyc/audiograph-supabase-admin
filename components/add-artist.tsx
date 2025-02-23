// app/admin/artists/add/page.tsx
'use client';

import { useState, useEffect } from "react";
import {SpotifySearch} from "@/components/features/spotify-search/spotify-search";
import MultiStepLoader from "@/components/multi-step-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight } from "lucide-react";
import { SpotifyArtist } from "@/types/artists";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { supabase } from '@/utils/supabase/client';

type Stage = "ERROR" | "COMPLETE" | "INIT" | "METADATA" | "ANALYTICS" | "VIDEO_DATA" | "TRACK_DATA" | "URL_DATA" | "WIKIPEDIA" | "STORE" | "COMPLETE";

interface StageUpdate {
  stage: Stage;
  message: string;
  details: string;
  progress?: number;
  result?: any;
  payload?: any;
}

const TEST_ARTIST: SpotifyArtist = {
  spotify_id: "6M2wZ9GZgrQXHCFfjv46we",
  name: "Dua Lipa",
  image_url: "https://i.scdn.co/image/ab6761610000e5eb0c68f6c95232e716f0abee8d",
  genres: ["pop"],
  popularity: 86,
  followers: 45584559
};


export function AddArtist() {
  const [currentStage, setCurrentStage] = useState<StageUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [artistSlug, setArtistSlug] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<any>(null);

  const processArtist = async (spotifyArtist: SpotifyArtist) => {
    console.log('Starting artist process with:', spotifyArtist);
    setIsProcessing(true);
    setError(null);
    setCurrentStage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) {
        throw new Error('Unauthorized');
      }

      const response = await fetch('/api/artists/get-artist-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...spotifyArtist })
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const messages = chunk
          .split('\n\n')
          .filter(msg => msg.startsWith('data: '))
          .map(msg => JSON.parse(msg.slice(6)));

        for (const message of messages) {
          console.log('Received SSE message:', message);
          if (message.stage === 'ERROR') {
            setError(message.details);
            if (message.details.toLowerCase().includes('validation')) {
              setValidationErrors(message.details);
            }
            setIsProcessing(false);
            return;
          }
          setCurrentStage(message);
          if (message.stage === 'COMPLETE') {
            console.log('Complete message payload:', message.payload);
            setIsProcessing(false);
            setFinalResult(message.payload || message.details);
            console.log('MESSAGE PAYLOAD==========================', message.payload);
            if (message.payload?.data.slug) {
              setArtistSlug(message.payload.data.slug);
            } else {
              console.error('Missing slug in response:', message);
              setError('Failed to get artist URL');
            }
            setValidationErrors(null);
          }
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process artist');
      setIsProcessing(false);
    }
  };

  const handleArtistSelect = (spotifyArtist: SpotifyArtist) => {
    setSelectedArtist(spotifyArtist);
  };

  const handleStartProcess = () => {
    if (!selectedArtist) {
      setError('Please select an artist first');
      return;
    }
    processArtist(selectedArtist);
  };

  const handleClearSelection = () => {
    setSelectedArtist(null);
    setCurrentStage(null);
    setError(null);
    setValidationErrors(null);
    setIsProcessing(false);
    setFinalResult(null);
    setArtistSlug(null);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Artist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {validationErrors && (
              <Alert variant="destructive">
                <AlertDescription>
                  <pre className="whitespace-pre-wrap">{validationErrors}</pre>
                </AlertDescription>
              </Alert>
            )}

            {error && !validationErrors && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <SpotifySearch 
              onArtistSelect={handleArtistSelect} 
              onClearSelection={handleClearSelection}
            />
                <Button 
          variant="outline"
          onClick={() => {
            setSelectedArtist(TEST_ARTIST);
            setError(null);
          }}
        >
          Load Test Artist
        </Button>
            {selectedArtist && (
              <Button 
                onClick={handleStartProcess} 
                disabled={isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing Artist
                  </>
                ) : (
                  'Start Processing'
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {(isProcessing || currentStage) && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Status</CardTitle>
          </CardHeader>
          <CardContent>
            <MultiStepLoader 
              currentStage={currentStage}
              error={error}
            />
            {currentStage?.stage === 'COMPLETE' && currentStage.payload && (
              <div className="mt-4 flex justify-center">
                <Button asChild>
                  <Link 
                    href={`/artists/${artistSlug}`}
                    className="flex items-center gap-2"
                  >
                    View Artist <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* {finalResult && (
        <ScrollArea className="mt-4 h-60 border rounded">
          <div className="p-4">
            <h3 className="font-semibold mb-2">Final Result</h3>
            <pre>{JSON.stringify(finalResult, null, 2)}</pre>
          </div>
        </ScrollArea> */}      
    </div>
  );
}
// // app/admin/artists/add/page.tsx
// 'use client';

// import { useState } from 'react';
// import { SpotifySearch } from '@/components/features/spotify-search/spotify-search';
// import { ArtistProgress } from '@/components/features/progress/artist-progress';
// import { Button } from '@/components/ui/button';
// import { SpotifyArtist } from '@/types/artists';
// import {MultiStepLoader} from '@/components/multi-step-loader';

// // Add test data
// const TEST_ARTIST: SpotifyArtist = {
//   spotify_id: "6M2wZ9GZgrQXHCFfjv46we",
//   name: "Dua Lipa",
//   image_url: "https://i.scdn.co/image/ab6761610000e5eb0c68f6c95232e716f0abee8d",
//   genres: ["pop"],
//   popularity: 86,
//   followers: 45584559
// };

// export function AddArtist() {
//   const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
//   const [eventSource, setEventSource] = useState<EventSource | null>(null);
//   const [error, setError] = useState<string | null>(null);

//   const handleArtistSelect = (artist: SpotifyArtist) => {
//     setSelectedArtist(artist);
//     setError(null);
//   };

//   const processArtist = async (artist: SpotifyArtist) => {
//     if (eventSource) {
//       eventSource.close();
//     }

//     try {
//       const response = await fetch('/api/artists/get-artist-full', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(artist),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.error || 'Failed to process artist');
//       }

//       const newEventSource = new EventSource(`/api/artists/progress/${artist.spotify_id}`);
//       setEventSource(newEventSource);
//     } catch (error) {
//       setError(error instanceof Error ? error.message : 'Failed to process artist');
//       console.error('Error processing artist:', error);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       <div className="flex gap-4">
//         <SpotifySearch onArtistSelect={handleArtistSelect} />
//         <Button 
//           variant="outline"
//           onClick={() => {
//             setSelectedArtist(TEST_ARTIST);
//             setError(null);
//           }}
//         >
//           Load Test Artist
//         </Button>
//       </div>
      
//       {selectedArtist && (
//         <div className="flex flex-col items-center gap-4">
//           <div className="flex items-center gap-4">
//             <Button 
//               onClick={() => processArtist(selectedArtist)}
//               disabled={!!eventSource}
//             >
//               Add {selectedArtist.name}
//             </Button>
//             {selectedArtist === TEST_ARTIST && (
//               <span className="text-sm text-muted-foreground">
//                 Using test data (Dua Lipa)
//               </span>
//             )}
//           </div>
//         </div>
//       )}

//       {error && (
//         <div className="p-4 bg-destructive/10 text-destructive rounded-md">
//           {error}
//         </div>
//       )}

//       {eventSource && <ArtistProgress eventSource={eventSource} />}
//     </div>
//   );
// }