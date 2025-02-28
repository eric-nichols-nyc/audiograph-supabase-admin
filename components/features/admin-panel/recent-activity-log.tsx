"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Music, 
  Youtube, 
  RefreshCw 
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
type ActivityType = "success" | "error" | "warning" | "info";
type Platform = "spotify" | "youtube" | "system";

interface Activity {
  id: string;
  timestamp: string;
  type: ActivityType;
  message: string;
  platform: Platform;
  details?: string;
}

export function RecentActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        // In a real implementation, you would fetch this data from your API
        // For now, we'll use placeholder data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1200));
        
        setActivities([
          {
            id: "1",
            timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
            type: "success",
            message: "Spotify listeners collection completed",
            platform: "spotify",
            details: "Updated 98 artists"
          },
          {
            id: "2",
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
            type: "error",
            message: "YouTube metrics collection failed",
            platform: "youtube",
            details: "API rate limit exceeded"
          },
          {
            id: "3",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
            type: "success",
            message: "YouTube metrics collection completed",
            platform: "youtube",
            details: "Updated 87 artists"
          },
          {
            id: "4",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
            type: "warning",
            message: "Some artists missing Spotify IDs",
            platform: "spotify",
            details: "22 artists need attention"
          },
          {
            id: "5",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            type: "info",
            message: "Scheduled metrics collection started",
            platform: "system"
          },
          {
            id: "5",
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
            type: "info",
            message: "Scheduled metrics collection started",
            platform: "system"
          }
        ]);
      } catch (error) {
        console.error("Error fetching activities:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchActivities();
  }, []);
  
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
  
  // Get icon based on activity type and platform
  const getActivityIcon = (activity: Activity) => {
    if (activity.type === "success") {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (activity.type === "error") {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else if (activity.type === "warning") {
      return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    } else if (activity.platform === "spotify") {
      return <Music className="h-5 w-5 text-primary" />;
    } else if (activity.platform === "youtube") {
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
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No recent activity found
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto flex-grow">
            {activities.map(activity => (
              <div key={activity.id} className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity)}
                </div>
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