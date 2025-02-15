// app/admin/artists/add/page.tsx
'use client';

import { useState, useEffect } from "react";
import SpotifySearch from "@/components/features/spotify-search/spotify-search";
import MultiStepLoader from "@/components/multi-step-loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { SpotifyArtist } from "@/types/artists";

type Stage = "ERROR" | "COMPLETE" | "INIT" | "METADATA" | "ANALYTICS" | "VIDEO_DATA" | "TRACK_DATA" | "URL_DATA" | "WIKIPEDIA" | "STORE" | "COMPLETE";

interface StageUpdate {
  stage: Stage;
  message: string;
  details: string;
  progress?: number;
  result?: any;
}

export default function AddArtist() {
  const [currentStage, setCurrentStage] = useState<StageUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<SpotifyArtist | null>(null);
  const [finalResult, setFinalResult] = useState<any>(null);

  const processArtist = async (spotifyArtist: SpotifyArtist) => {
    setIsProcessing(true);
    setError(null);
    setCurrentStage(null);

    try {
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
          if (message.stage === 'ERROR') {
            setError(message.details);
            setIsProcessing(false);
            return;
          }
          setCurrentStage(message);
          if (message.stage === 'COMPLETE') {
            console.log('result', message.payload);
            setIsProcessing(false);
            setFinalResult(message.payload || message.details);
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Artist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <SpotifySearch onArtistSelect={handleArtistSelect} />
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

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
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
          </CardContent>
        </Card>
      )}

      {finalResult && (
        <div className="mt-4 p-4 border rounded">
          <h3 className="font-semibold mb-2">Final Result</h3>
          <pre>{JSON.stringify(finalResult, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}