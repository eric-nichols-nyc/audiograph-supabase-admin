import { ContentLayout } from "@/components/admin-panel/content-layout";
import { ArtistMetricsTable } from "@/components/features/artist-table/artist-metrics-table";
import { TriggerRankingUpdate } from '@/components/trigger-ranking-update';

export default function ArtistsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Artists</h1>
        <TriggerRankingUpdate />
      </div>
      <ContentLayout title="Artists">
        <ArtistMetricsTable />
      </ContentLayout>
    </div>
  );
}
