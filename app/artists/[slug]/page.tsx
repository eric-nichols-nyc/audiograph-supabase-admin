import { ArtistDetailView } from "@/components/artist-detail-view";
import eminemData from "@/public/eminem-inserted-artist.json";
import { createClient } from "@/utils/supabase/server";


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
        track_id,
        tracks!track_id(*)
      ),
      artist_videos (
        video_id,
        videos!video_id(*)
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) throw new Error(error.message);
  return artist;
}

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const artistData = await getArtistData(params.slug);
  console.log('artistData ', artistData);
  return <ArtistDetailView data={eminemData.data} />;
}
