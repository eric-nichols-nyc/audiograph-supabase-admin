import { BatchArtists } from "@/components/features/batch/batch-artists";
import { ContentLayout } from "@/components/admin-panel/content-layout";

export default function BatchAddPage() {
  return (
    <ContentLayout title="Batch Add Artists">
      <BatchArtists />
    </ContentLayout>
  );
} 