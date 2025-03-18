import { ContentLayout } from "@/components/features/admin-panel/content-layout";
import { ArtistMetricsTable } from "@/components/features/artist-table/artist-metrics-table";
import { TriggerRankingUpdate } from '@/components/trigger-ranking-update';
import ArtistsTable from "@/components/artists-table";
import { getArtists } from "@/actions/artist";

export default async function ArtistsPage() {
  <p>Artist page</p>
   try {
    const result = await getArtists();

    const artists = result?.data;
    
    console.log('Artists in page:', {
      artists,
      isArray: Array.isArray(artists?.data),
      length: artists?.data?.length,
      type: typeof artists
    });
    
    if (!artists || !Array.isArray(artists.data) || artists.data.length === 0) {
      return (
        <div className="container mx-auto py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Artists</h1>
            <TriggerRankingUpdate />
          </div>
          <ContentLayout title="Artists">
            <div>No artists found in the database</div>
          </ContentLayout>
        </div>
      );
    }

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
   } catch (error) {
    console.error('Error loading artists:', error);
    return (
      <div className="container mx-auto py-6">
        <div>Error loading artists</div>
      </div>
    );
   }
}
