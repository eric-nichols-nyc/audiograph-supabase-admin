import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArtistMetric } from '@/types/artists';
import { formatNumber } from '@/utils/format/numbers';
import { formatDate } from '@/utils/format/dates';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface MetricsCardProps {
  metrics?: ArtistMetric[];
}

export function MetricsCard({ metrics = [] }: MetricsCardProps) {
  // Group metrics by platform and metric_type
  const groupedMetrics = metrics.reduce((acc, metric) => {
    const key = `${metric.platform}_${metric.metric_type}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(metric);
    return acc;
  }, {} as Record<string, ArtistMetric[]>);

  // Get latest metrics for each platform
  const latestMetrics = metrics.reduce((acc: Record<string, ArtistMetric>, curr) => {
    if (!acc[curr.platform] || new Date(curr.date) > new Date(acc[curr.platform].date)) {
      acc[curr.platform] = curr;
    }
    return acc;
  }, {} as Record<string, ArtistMetric>);

  // Calculate growth rates for Spotify followers and YouTube subscribers
  const calculateGrowthRate = (platform: string, metricType: string): { rate: number | null, previous: number | null } => {
    const key = `${platform}_${metricType}`;
    const platformMetrics = groupedMetrics[key];
    
    if (!platformMetrics || platformMetrics.length < 2) {
      return { rate: null, previous: null };
    }
    
    // Sort by date descending
    const sortedMetrics = [...platformMetrics].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    const current = sortedMetrics[0];
    const previous = sortedMetrics[1];
    
    if (!current || !previous) {
      return { rate: null, previous: null };
    }
    
    const growthRate = ((current.value - previous.value) / previous.value) * 100;
    return { 
      rate: growthRate,
      previous: previous.value 
    };
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Platform Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(latestMetrics).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(latestMetrics).map(([platform, metric]) => {
              // Only calculate growth for Spotify followers and YouTube subscribers
              const showGrowth = 
                (platform === 'spotify' && metric.metric_type === 'followers') || 
                (platform === 'youtube' && metric.metric_type === 'subscribers');
              
              const growth = showGrowth 
                ? calculateGrowthRate(platform, metric.metric_type)
                : { rate: null, previous: null };

              return (
                <div key={platform} className="p-4 border rounded-lg">
                  <h3 className="font-semibold capitalize mb-2">{platform}</h3>
                  <div className="text-sm text-gray-600">
                    <p>
                      {metric.metric_type}: {formatNumber(metric.value)}
                    </p>
                    
                    {growth.rate !== null && (
                      <div className="flex items-center mt-1">
                        <span className="text-xs mr-1">Daily growth:</span>
                        <span className={`text-xs flex items-center ${growth.rate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {growth.rate >= 0 ? (
                            <ArrowUp className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDown className="h-3 w-3 mr-1" />
                          )}
                          {growth.rate.toFixed(2)}%
                        </span>
                      </div>
                    )}
                    
                    <p className="text-xs mt-1">Updated: {formatDate(metric.date)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No metrics available</p>
        )}
      </CardContent>
    </Card>
  );
} 