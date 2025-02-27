import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getArtists } from '@/actions/artist'
import AdminPanelLayout from "@/components/features/admin-panel/admin-panel-layout"

export default async function ArtistsLayout({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient()
  
  await queryClient.prefetchQuery({
    queryKey: ['artists'],
    queryFn: () => getArtists(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,   // 10 minutes
  })

  return (
    <AdminPanelLayout>
      <HydrationBoundary state={dehydrate(queryClient)}>
        {children}
      </HydrationBoundary>
    </AdminPanelLayout>
  )
}