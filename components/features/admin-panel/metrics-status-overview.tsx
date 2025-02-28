"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { 
  BarChart3, 
  Music, 
  Youtube, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users
} from "lucide-react";
import Image from "next/image";

type MetricsSummary = {
  totalArtists: number;
  artistsWithSpotify: number;
  artistsWithYoutube: number;
  lastSpotifyUpdate: string | null;
  lastYoutubeUpdate: string | null;
  spotifyMetricsCount: number;
  youtubeMetricsCount: number;
  lastSpotifyFollowersUpdate: string | null;
  spotifyFollowersCount: number;
};

export function MetricsStatusOverview() {
  const [summary, setSummary] = useState<MetricsSummary>({
    totalArtists: 0,
    artistsWithSpotify: 0,
    artistsWithYoutube: 0,
    lastSpotifyUpdate: null,
    lastYoutubeUpdate: null,
    spotifyMetricsCount: 0,
    youtubeMetricsCount: 0,
    lastSpotifyFollowersUpdate: null,
    spotifyFollowersCount: 0
  });
  
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        // In a real implementation, you would fetch this data from your API
        // For now, we'll use placeholder data
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSummary({
          totalArtists: 120,
          artistsWithSpotify: 98,
          artistsWithYoutube: 87,
          lastSpotifyUpdate: "2023-11-15T08:30:00Z",
          lastYoutubeUpdate: "2023-11-14T14:45:00Z",
          spotifyMetricsCount: 1254,
          youtubeMetricsCount: 987,
          lastSpotifyFollowersUpdate: "2023-11-15T10:15:00Z",
          spotifyFollowersCount: 1120
        });
      } catch (error) {
        console.error("Error fetching metrics summary:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSummary();
  }, []);
  
  // Format date to a readable format
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Calculate coverage percentages
  const spotifyCoverage = summary.totalArtists > 0 
    ? Math.round((summary.artistsWithSpotify / summary.totalArtists) * 100) 
    : 0;
    
  const youtubeCoverage = summary.totalArtists > 0 
    ? Math.round((summary.artistsWithYoutube / summary.totalArtists) * 100) 
    : 0;
  
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4 flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="font-medium">Total Artists</span>
              </div>
              <span className="text-2xl font-bold">{summary.totalArtists}</span>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Image 
                  src="/images/spotify.svg" 
                  alt="Spotify" 
                  width={16} 
                  height={16} 
                />
                <span className="font-medium">Spotify Coverage</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{spotifyCoverage}%</span>
                <span className="text-sm text-gray-500">
                  {summary.artistsWithSpotify} of {summary.totalArtists} artists
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${spotifyCoverage}%` }}
                ></div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Image 
                  src="/images/youtube.svg" 
                  alt="YouTube" 
                  width={16} 
                  height={16} 
                />
                <span className="font-medium">YouTube Coverage</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{youtubeCoverage}%</span>
                <span className="text-sm text-gray-500">
                  {summary.artistsWithYoutube} of {summary.totalArtists} artists
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-red-600 h-2.5 rounded-full" 
                  style={{ width: `${youtubeCoverage}%` }}
                ></div>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="font-medium">Metrics Collected</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Image 
                    src="/images/spotify.svg" 
                    alt="Spotify" 
                    width={16} 
                    height={16} 
                  />
                  <span className="text-sm">{summary.spotifyMetricsCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Image 
                    src="/images/youtube.svg" 
                    alt="YouTube" 
                    width={16} 
                    height={16} 
                  />
                  <span className="text-sm">{summary.youtubeMetricsCount}</span>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-green-600" />
                <span className="font-medium">Spotify Followers</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm">{summary.spotifyFollowersCount} followers</span>
              </div>
            </Card>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <span className="font-medium">Missing Data</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Image 
                    src="/images/spotify.svg" 
                    alt="Spotify" 
                    width={16} 
                    height={16} 
                  />
                  <span className="text-sm">{summary.totalArtists - summary.artistsWithSpotify} artists</span>
                </div>
                <div className="flex items-center gap-1">
                  <Image 
                    src="/images/youtube.svg" 
                    alt="YouTube" 
                    width={16} 
                    height={16} 
                  />
                  <span className="text-sm">{summary.totalArtists - summary.artistsWithYoutube} artists</span>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
} 