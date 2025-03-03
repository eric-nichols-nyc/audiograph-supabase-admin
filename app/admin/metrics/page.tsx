'use client';
import { Suspense, useState, useEffect } from 'react';
import { ContentLayout } from '@/components/features/admin-panel/content-layout';
import { MetricsStatusOverview } from '@/components/features/admin-panel/metrics-status-overview';
import {
  ActivityLogContent,
  ActivityLogSkeleton,
} from '@/components/features/admin-panel/recent-activity-log';
import { MetricsControlPanel } from '@/components/features/admin-panel/metrics-control-panel';
import { ArtistPlatformStatus } from '@/components/features/admin-panel/artist-platform-status';
import { MetricsDashboardClient } from '@/components/features/admin-panel/metrics-dashboard-client';
export default function MetricsAdminPage() {
  return (
    <ContentLayout title="Metrics Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 mt-10">
        <MetricsStatusOverview />
        <Suspense fallback={<ActivityLogSkeleton />}>
          <ActivityLogContent />
        </Suspense>
      </div>
      <MetricsControlPanel />
      <ArtistPlatformStatus />
    </ContentLayout>
  );
}
