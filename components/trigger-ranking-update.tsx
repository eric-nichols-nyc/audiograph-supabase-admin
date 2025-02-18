'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';  // Use the singleton instance

export function TriggerRankingUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);

  const triggerUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/rankings/trigger', {
        method: 'POST'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to trigger rankings update');
      }

      console.log('Rankings update triggered successfully');
    } catch (error) {
      console.error(error instanceof Error ? error.message : 'Failed to trigger rankings update');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Button 
      onClick={triggerUpdate} 
      disabled={isUpdating}
      variant="outline"
    >
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