import { ContentLayout } from "@/components/features/admin-panel/content-layout";
import { ArtistPlatformTable } from "@/components/features/artist-table/artist-platform-table";
import { TriggerRankingUpdate } from '@/components/trigger-ranking-update';

async function getArtistsWithPlatforms() {
  try {
    // Use localhost:3001 for local development
    const baseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '';
    const response = await fetch(`${baseUrl}/api/artists/with-platforms`, {
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const data = await response.json();
    console.log('Page: Artists data fetched successfully');
    return data;
  } catch (error) {
    console.error('Page: Error in getArtistsWithPlatforms:', error);
    throw error;
  }
}

export default async function ArtistsPage() {
  try {
    console.log('Page: Starting to fetch artists data...');
    const result = await getArtistsWithPlatforms();
    console.log('Page: Artists data received:', {
      success: result.success,
      count: result.data?.artists?.length,
      withSimilar: result.data?.with_similar
    });

    if (!result.success || !result.data?.artists || result.data.artists.length === 0) {
      console.log('Page: No artists found in result:', result);
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
          <div className="mb-4 text-sm text-muted-foreground">
            Total Artists: {result.data.count} | Artists with Similar: {result.data.with_similar}
          </div>
          <ArtistPlatformTable artists={result.data.artists} />
        </ContentLayout>
      </div>
    );
  } catch (error) {
    console.error('Page: Error in ArtistsPage:', error);
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Artists</h1>
          <TriggerRankingUpdate />
        </div>
        <ContentLayout title="Artists">
          <div className="text-red-500">
            Error loading artists. Please check the console for details.
          </div>
        </ContentLayout>
      </div>
    );
  }
}
