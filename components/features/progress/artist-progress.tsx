'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressState {
  stage: string;
  message: string;
  details: string;
  progress: number;
  payload?: any;
}

export function ArtistProgress({ eventSource }: { eventSource: EventSource }) {
  const [progress, setProgress] = useState<ProgressState>({
    stage: '',
    message: '',
    details: '',
    progress: 0
  });

  useEffect(() => {
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setProgress(data);
    };

    return () => {
      eventSource.close();
    };
  }, [eventSource]);

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-lg border bg-card space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              progress.stage === 'ERROR' ? 'bg-destructive' : 'bg-primary'
            )}
            style={{ width: `${progress.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{progress.progress}%</span>
          <span>{progress.stage}</span>
        </div>
      </div>
      
      {/* Current stage display */}
      <div className="text-center space-y-2">
        <h3 className="font-medium text-lg">{progress.message}</h3>
        <p className="text-sm text-muted-foreground">{progress.details}</p>
      </div>

      {/* Error state */}
      {progress.stage === 'ERROR' && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          {progress.details}
        </div>
      )}

      {/* Success state */}
      {progress.stage === 'COMPLETE' && (
        <div className="p-4 rounded-md bg-primary/10 text-primary text-sm">
          Artist successfully added!
        </div>
      )}
    </div>
  );
} 