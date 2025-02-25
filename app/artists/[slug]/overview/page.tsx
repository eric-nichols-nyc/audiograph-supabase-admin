import { ArtistInfo } from "@/components/features/artist-detail/artist-info"
import { getArtistBySlug } from "@/actions/artist"
import { PlatformIds } from "@/components/features/artist-detail/platgorm_id"
import { ContentLayout } from "@/components/admin-panel/content-layout"

export default async function OverviewPage({ params }: { params: { slug: string } }) {
  const { artist, platformIds } = await getArtistBySlug(params.slug)
  
  return (
    <ContentLayout title="Overview">
      <div className="space-y-6">
        <ArtistInfo artist={artist} />
        <PlatformIds platformIds={platformIds} />
      </div>
    </ContentLayout>
  )
}