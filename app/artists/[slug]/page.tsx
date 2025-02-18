import { ArtistDetailView } from "@/components/features/artist-detail/artist-detail-view";
import { getArtistData } from "@/actions/artist";
import { createClient } from "@/utils/supabase/server";

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = await createClient();
  const { data: artist } = await supabase
    .from("artists")
    .select("name")
    .eq("slug", slug)
    .single();

  return {
    title: artist?.name || "Artist",
  };
}

export default async function ArtistPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const supabase = await createClient();
  
  const { data: artist } = await supabase
    .from("artists")
    .select(`
      *,
      artist_platform_ids (*),
      artist_metrics (*),
      artist_tracks (
        tracks (*)
      ),
      artist_videos (
        videos (*)
      )
    `)
    .eq("slug", slug)
    .single();

  if (!artist) {
    return <div>Artist not found</div>;
  }

  return <ArtistDetailView data={artist} />;
}
