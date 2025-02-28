"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  RefreshCw
} from "lucide-react";
import { useQueryClient } from '@tanstack/react-query';

type MetricJob = {
  id: string;
  name: string;
  icon: string;
  lastRun?: string;
  status?: "idle" | "running" | "success" | "error";
};

export function MetricsControlPanel() {
  const [jobs, setJobs] = useState<MetricJob[]>([
    {
      id: "spotify-listeners",
      name: "Monthly Listeners",
      icon: "/images/spotify.svg",
      lastRun: "Never",
      status: "idle"
    },
    {
      id: "spotify-followers",
      name: "Followers",
      icon: "/images/spotify.svg",
      lastRun: "Never",
      status: "idle"
    },
    {
      id: "youtube-metrics",
      name: "Subscribers",
      icon: "/images/youtube.svg",
      lastRun: "Never",
      status: "idle"
    },
    // Add more metric collection jobs as needed
  ]);

  const queryClient = useQueryClient();
  
  // Simplified job triggering function
  const triggerJob = async (jobId: string) => {
    console.log(`Triggering job: ${jobId}`);
    
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
      // Get artist IDs from database
      const artistsResponse = await fetch('/api/artists/spotify-ids', {
        method: 'GET'
      });
      
      if (!artistsResponse.ok) {
        throw new Error('Failed to fetch artist IDs');
      }
      
      const { artistIds } = await artistsResponse.json();
      
      // Call the Playwright scraping endpoint
      const response = await fetch('/api/scrape/spotify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ artistIds })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger job: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Scraping results:', data);
      
      // Process the results directly
      if (data.results && data.results.length > 0) {
        await processResults(jobId, data.results);
        
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
        
        // Refresh data
        queryClient.invalidateQueries(['metrics-summary']);
        queryClient.invalidateQueries(['artists', 'platform-status']);
      } else {
        throw new Error('No results returned from scraping');
      }
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

  // Simplified polling function
  const pollForResults = async (jobId: string, datasetId: string) => {
    console.log(`Polling for results: ${jobId}, datasetId: ${datasetId}`);
    
    const jobIndex = jobs.findIndex(job => job.id === jobId);
    if (jobIndex === -1) return;
    
    try {
      // STEP 3: Check if results are ready
      const response = await fetch(`/api/artists/scrape/bright-data?datasetId=${datasetId}`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get results: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Poll response:', data);
      
      // Check if we have results - Bright Data specific format
      if (data.status === 'COMPLETED' || data.status === 'DELIVERED' || 
          (Array.isArray(data) && data.length > 0)) {
        // We have results
        const results = Array.isArray(data) ? data : data.results || [];
        
        // STEP 4: Process the results
        await processResults(jobId, results);
        
        // STEP 5: Update UI to show success
        setJobs(prev => {
          const updated = [...prev];
          updated[jobIndex] = { 
            ...updated[jobIndex], 
            status: "success",
            lastRun: new Date().toLocaleString() 
          };
          return updated;
        });
        
        // STEP 6: Refresh data
        queryClient.invalidateQueries(['metrics-summary']);
        queryClient.invalidateQueries(['artists', 'platform-status']);
      } else if (data.status === 'FAILED' || data.status === 'ERROR' || data.error) {
        throw new Error(data.error || 'Collection failed');
      } else {
        // Still processing, poll again in 5 seconds
        console.log('Still processing, polling again in 5 seconds...');
        setTimeout(() => pollForResults(jobId, datasetId), 5000);
      }
    } catch (error) {
      console.error(`Error polling for results for job ${jobId}:`, error);
      
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

  // Process results function
  const processResults = async (jobId: string, results: any) => {
    console.log(`Processing results for job: ${jobId}`);
    
    try {
      // STEP 7: Send results to processing endpoint
      const response = await fetch('/api/admin/process-spotify-listeners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ results })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process results: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Processing complete:', data);
      
      return data;
    } catch (error) {
      console.error(`Error processing results for job ${jobId}:`, error);
      throw error;
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image 
                  src={job.icon} 
                  alt={job.name} 
                  width={20} 
                  height={20} 
                />
                <h3 className="font-medium">{job.name}</h3>
              </div>
              
              {job.status === "running" ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : job.status === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : job.status === "error" ? (
                <AlertCircle className="h-5 w-5 text-red-500" />
              ) : null}
            
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