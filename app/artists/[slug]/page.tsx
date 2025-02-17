import { ArtistDetailView } from "@/components/features/artist-detail/artist-detail-view";
import { getArtistData } from "@/actions/artist";

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  let artistData = null;
  try {
    artistData = await getArtistData(params.slug);
  } catch (error) {
    console.error('Error fetching artist data:', error);
  }

  if (!artistData) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <p className="text-center text-gray-500">Artist not found.</p>
      </div>
    );
  }

  console.log('artistData ', artistData);
  return <ArtistDetailView data={artistData} />;
}
