import ArtistNav from '@/components/navigation/artist-nav'
import { getArtistBySlug } from '@/actions/artist'

export default async function ArtistLayout({ children, params }: { 
  children: React.ReactNode,
  params: { slug: string }
}) {
  // Fetch artist data
  const { artist, platformIds } = await getArtistBySlug(params.slug)
  
  return (
    <div className="flex flex-col w-full gap-6 pt-14">
      <div className="w-full border-b">
        <ArtistNav artist={artist} />
      </div>
      <div className="flex w-full">
        {children}
      </div>
    </div>
  )
}