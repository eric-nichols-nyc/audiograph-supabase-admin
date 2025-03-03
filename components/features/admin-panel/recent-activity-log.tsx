'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Music, Youtube, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createBrowserSupabase } from '@/lib/supabase/client';

type ActivityType = 'success' | 'error' | 'warning' | 'info';
type Platform = 'spotify' | 'youtube' | 'system';

interface Activity {
  id: string;
  timestamp: string;
  type: ActivityType;
  message: string;
  platform: Platform;
  details?: string;
}

// Loading fallback component
export function ActivityLogSkeleton() {
  return (
    <div className="h-full">
      <Card className="p-4 h-full overflow-hidden flex flex-col">
        <h3 className="font-medium mb-4">Recent Activity</h3>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    </div>
  );
}

// The actual activity log content
export function ActivityLogContent() {
  const queryClient = useQueryClient();

  // Use React Query to fetch and cache the data
  const { data, isLoading, error } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activity-logs');
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      const data = await response.json();
      return data.activities as Activity[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up real-time subscription
  useEffect(() => {
    const supabase = createBrowserSupabase();

    // Subscribe to changes in the activity_logs table
    const subscription = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        payload => {
          // Use React Query's cache to add the new activity
          queryClient.setQueryData(['activity-logs'], (oldData: Activity[] = []) => {
            return [payload.new as Activity, ...oldData].slice(0, 20);
          });
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Format relative time
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

  // Get icon for activity
  const getActivityIcon = (activity: Activity) => {
    if (activity.type === 'success') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (activity.type === 'error') {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (activity.type === 'warning') {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    } else if (activity.platform === 'spotify') {
      return <Music className="h-5 w-5 text-primary" />;
    } else if (activity.platform === 'youtube') {
      return <Youtube className="h-5 w-5 text-primary" />;
    } else {
      return <RefreshCw className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="h-full">
      <Card className="p-4 h-full overflow-hidden flex flex-col">
        <h3 className="font-medium mb-4">Recent Activity</h3>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">Error loading activity logs</div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent activity found</div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-grow">
              {data.map(activity => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">{getActivityIcon(activity)}</div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <p className="font-medium">{activity.message}</p>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(activity.timestamp)}
                      </span>
                    </div>
                    {activity.details && (
                      <p className="text-sm text-gray-500 mt-1">{activity.details}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}

// Main component with Suspense
export function RecentActivityLog() {
  return <ActivityLogContent />;
}
