'use client';

import { MetricsStatusOverview } from '@/components/features/admin-panel/metrics-status-overview';
import { RecentActivityLog } from '@/components/features/admin-panel/recent-activity-log';
import { MetricsControlPanel } from '@/components/features/admin-panel/metrics-control-panel';
import { ArtistPlatformStatus } from '@/components/features/admin-panel/artist-platform-status';

export function MetricsDashboardClient() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-10">
        <MetricsStatusOverview />
        <RecentActivityLog />
      </div>
      <MetricsControlPanel />
      <ArtistPlatformStatus />
    </>
  );
}
