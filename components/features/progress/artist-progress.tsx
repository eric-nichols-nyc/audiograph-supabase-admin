'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { ProgressUpdate } from '@/types/progress';

interface ArtistProgressProps {
  status: ProgressUpdate;  // Change from eventSource to status
}

export function ArtistProgress({ status }: ArtistProgressProps) {
  // Remove useState and useEffect - we'll use the passed status directly
  
  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-lg border bg-card space-y-6">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className={cn(
              "h-2 rounded-full transition-all duration-500",
              status.stage === 'ERROR' ? 'bg-destructive' : 'bg-primary'
            )}
            style={{ width: `${status.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{status.progress}%</span>
          <span>{status.stage}</span>
        </div>
      </div>
      
      {/* Current stage display */}
      <div className="text-center space-y-2">
        <h3 className="font-medium text-lg">{status.message}</h3>
        <p className="text-sm text-muted-foreground">{status.details}</p>
      </div>

      {/* Error state */}
      {status.stage === 'ERROR' && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm">
          {status.details}
        </div>
      )}

      {/* Success state */}
      {status.stage === 'COMPLETE' && (
        <div className="p-4 rounded-md bg-primary/10 text-primary text-sm">
          Artist successfully added!
        </div>
      )}
    </div>
  );
} 