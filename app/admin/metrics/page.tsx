import { ContentLayout } from "@/components/features/admin-panel/content-layout";
import { MetricsControlPanel } from "@/components/features/admin-panel/metrics-control-panel";
import { MetricsStatusOverview } from "@/components/features/admin-panel/metrics-status-overview";
import { RecentActivityLog } from "@/components/features/admin-panel/recent-activity-log";
import { ArtistPlatformStatus } from "@/components/features/admin-panel/artist-platform-status";

export default async function MetricsAdminPage() {
  return (
    <ContentLayout title="Artist Platform Status">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <MetricsStatusOverview />
          <RecentActivityLog />
      </div>
        <MetricsControlPanel />
        <ArtistPlatformStatus />
      </ContentLayout> 
  );
} 