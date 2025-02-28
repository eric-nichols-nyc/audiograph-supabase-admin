"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  AlertCircle, 
  CheckCircle, 
  Music, 
  Youtube, 
  BarChart, 
  RefreshCw,
  Loader2
} from "lucide-react";

type MetricJob = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  endpoint: string;
  lastRun?: string;
  status?: "idle" | "running" | "success" | "error";
};

export function MetricsControlPanel() {
  const [jobs, setJobs] = useState<MetricJob[]>([
    {
      id: "spotify-listeners",
      name: "Spotify Monthly Listeners",
      description: "Collect monthly listener counts from Spotify",
      icon: <Music className="h-5 w-5" />,
      endpoint: "/api/admin/trigger-spotify-listeners",
      lastRun: "Never",
      status: "idle"
    },
    {
      id: "youtube-metrics",
      name: "YouTube Subscribers",
      description: "Collect subscriber counts from YouTube",
      icon: <Youtube className="h-5 w-5" />,
      endpoint: "/api/admin/trigger-youtube-metrics",
      lastRun: "Never",
      status: "idle"
    },
    // Add more metric collection jobs as needed
  ]);

  const triggerJob = async (jobId: string) => {
    // Find the job
    const jobIndex = jobs.findIndex(job => job.id === jobId);
    if (jobIndex === -1) return;
    
    // Update job status to running
    setJobs(prev => {
      const updated = [...prev];
      updated[jobIndex] = { ...updated[jobIndex], status: "running" };
      return updated;
    });
    
    try {
      // Call the API endpoint to trigger the job
      const response = await fetch(jobs[jobIndex].endpoint, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger job: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update job status to success
      setJobs(prev => {
        const updated = [...prev];
        updated[jobIndex] = { 
          ...updated[jobIndex], 
          status: "success",
          lastRun: new Date().toLocaleString() 
        };
        return updated;
      });
      
      // After 3 seconds, reset status to idle
      setTimeout(() => {
        setJobs(prev => {
          const updated = [...prev];
          updated[jobIndex] = { ...updated[jobIndex], status: "idle" };
          return updated;
        });
      }, 3000);
      
    } catch (error) {
      console.error(`Error triggering job ${jobId}:`, error);
      
      // Update job status to error
      setJobs(prev => {
        const updated = [...prev];
        updated[jobIndex] = { 
          ...updated[jobIndex], 
          status: "error",
          lastRun: new Date().toLocaleString() 
        };
        return updated;
      });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 mb-4">
        Manually trigger metrics collection jobs. Each job will collect data from the respective platform and update the database.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(job => (
          <Card key={job.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 p-2 rounded-full">
                  {job.icon}
                </div>
                <div>
                  <h3 className="font-medium">{job.name}</h3>
                  <p className="text-sm text-gray-500">{job.description}</p>
                </div>
              </div>
              
              {job.status === "running" ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : job.status === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : job.status === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : null}
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Last run: {job.lastRun}
              </div>
              <Button 
                size="sm" 
                onClick={() => triggerJob(job.id)}
                disabled={job.status === "running"}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Run Now
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
} 