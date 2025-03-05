'use client';

import { Card } from '@/components/ui/card';
import { CheckCircle, XCircle, AlertTriangle, Music, Youtube, RefreshCw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import useFetchActivityLogs, { ActivityLog } from '@/hooks/useFetchActivityLogs';

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
  const { activities, isLoading, error, formatRelativeTime } = useFetchActivityLogs();

  // Get icon for activity
  const getActivityIcon = (activity: ActivityLog) => {
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
          ) : !activities || activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent activity found</div>
          ) : (
            <div className="space-y-4 overflow-y-auto flex-grow">
              {activities.map(activity => (
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

// Main component
export function RecentActivityLog() {
  return <ActivityLogContent />;
}
