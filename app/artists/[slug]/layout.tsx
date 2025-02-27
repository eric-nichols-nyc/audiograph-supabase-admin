import { redirect } from 'next/navigation';
import ArtistNav from '@/components/navigation/artist-nav'
import { getArtistBySlug } from '@/actions/artist'
import { getUser } from '@/lib/supabase/auth/server'

export default async function ArtistLayout({ children, params }: { 
  children: React.ReactNode,
  params: { slug: string }
}) {
  // Check if user is authenticated
  const user  = await getUser();
  
  // Redirect to sign-in if not authenticated
  if (!user) {
    redirect('/sign-in?callbackUrl=' + encodeURIComponent(`/artists/${params.slug}`));
  }
  
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