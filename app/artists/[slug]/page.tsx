import { ArtistDetailView } from "@/components/features/artist-detail/artist-detail-view";
import { createClient } from "@/utils/supabase/server";
import { transformArtistResponse } from '@/utils/transforms/artist';

async function getArtistData(slug: string) {
  const supabase = await createClient();
  const { data: artist, error } = await supabase
    .from("artists")
    .select(`
      *,
      artist_platform_ids (*),
      artist_urls (*),
      artist_metrics (*),
      artist_tracks (
        tracks!track_id(*)
      ),
      artist_videos (
        videos!video_id(*)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);
  
  return transformArtistResponse(artist);
}

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
