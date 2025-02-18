import { ContentLayout } from "@/components/admin-panel/content-layout";
import ArtistsTable from "@/components/artists-table";
export default function ArtistsPage() {
  return (
  <ContentLayout title="Artists">
    <ArtistsTable />
  </ContentLayout>
  );
}
