import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArtistMetric } from '@/types/artists';
import { formatNumber } from '@/utils/format/numbers';
import { formatDate } from '@/utils/format/dates';

interface MetricsCardProps {
  metrics?: ArtistMetric[];
}

export function MetricsCard({ metrics = [] }: MetricsCardProps) {
  const latestMetrics = metrics.reduce((acc: Record<string, ArtistMetric>, curr) => {
    if (!acc[curr.platform] || new Date(curr.date) > new Date(acc[curr.platform].date)) {
      acc[curr.platform] = curr;
    }
    return acc;
  }, {} as Record<string, ArtistMetric>);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Platform Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(latestMetrics).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(latestMetrics).map(([platform, metric]) => (
              <div key={platform} className="p-4 border rounded-lg">
                <h3 className="font-semibold capitalize mb-2">{platform}</h3>
                <div className="text-sm text-gray-600">
                  <p>
                    {metric.metric_type}: {formatNumber(metric.value)}
                  </p>
                  <p className="text-xs mt-1">Updated: {formatDate(metric.date)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No metrics available</p>
        )}
      </CardContent>
    </Card>
  );
} 