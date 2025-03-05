import { useEffect } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type ActivityType = 'success' | 'error' | 'warning' | 'info';
export type Platform = 'spotify' | 'youtube' | 'system';

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: ActivityType;
  message: string;
  platform: Platform;
  details?: string;
  created_at: string;
}

export default function useFetchActivityLogs() {
  const queryClient = useQueryClient();
  const supabase = createBrowserSupabase();

  // Use React Query to fetch and cache the data
  const {
    data: activities,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activity-logs');
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      const data = await response.json();
      return data.activities as ActivityLog[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    // Subscribe to changes in the activity_logs table
    const subscription = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        payload => {
          console.log('New activity log:', payload.new);
          // Use React Query's cache to add the new activity
          queryClient.setQueryData(['activity-logs'], (oldData: ActivityLog[] = []) => {
            return [payload.new as ActivityLog, ...oldData].slice(0, 20);
          });
        }
      )
      .subscribe();

    // Clean up the subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient, supabase]);

  // Format relative time utility function
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  return {
    activities,
    isLoading,
    error,
    refetch,
    formatRelativeTime,
  };
}
