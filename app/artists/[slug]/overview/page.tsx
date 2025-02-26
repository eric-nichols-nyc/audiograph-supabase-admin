import { ArtistInfo } from "@/components/features/artist-detail/artist-info"
import { getArtistBySlug } from "@/actions/artist"
import { PlatformIds } from "@/components/features/artist-detail/data-sources"
import { ContentLayout } from "@/components/admin-panel/content-layout"
import { SocialMediaDashboard } from "@/components/features/artist-detail/social-media-dashboard"
export default async function OverviewPage({ params }: { params: { slug: string } }) {
  const { artist, platformIds } = await getArtistBySlug(params.slug)
  
  return (
    <ContentLayout title="Overview">
      <div className="space-y-6">
        <ArtistInfo artist={artist} />
        <PlatformIds platformIds={platformIds} artistId={artist.id} />
        <p>Social Media Dashboard</p>
        <SocialMediaDashboard artist={artist} />
      </div>
    </ContentLayout>
  )
}