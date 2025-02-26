import { ArtistInfo } from "@/components/features/artist-detail/artist-info"
import { getArtistBySlug } from "@/actions/artist"
import { PlatformIds } from "@/components/features/artist-detail/data-sources"

export default async function AudiencePage({ params }: { params: { slug: string } }) {
  const { artist, platformIds } = await getArtistBySlug(params.slug)
  
  return (
    <div className="space-y-6">
      <ArtistInfo artist={artist} />
      <PlatformIds platformIds={platformIds} artistId={artist.id} />
    </div>
  )
}