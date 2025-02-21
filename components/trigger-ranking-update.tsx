'use client';

import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function TriggerRankingUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const triggerUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/rankings/trigger', {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to trigger rankings update');
      }

      // Invalidate queries to refresh data
      await queryClient.invalidateQueries({ queryKey: ['artists'] });
      await queryClient.invalidateQueries({ queryKey: ['artist-metrics'] });
    } catch (error) {
      console.error('Failed to update rankings:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button onClick={triggerUpdate} disabled={isUpdating} variant="outline">
      {isUpdating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Updating Rankings...
        </>
      ) : (
        'Update Rankings'
      )}
    </Button>
  );
} 