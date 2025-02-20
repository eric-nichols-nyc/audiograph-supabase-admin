import { useQuery } from '@tanstack/react-query'
import { getArtistMetrics } from '@/actions/artist'
import { ArtistMetric } from '@/types/artists'

export function useArtistMetrics() {
  return useQuery<ArtistMetric[]>({
    queryKey: ['artist-metrics'],
    queryFn: async () => {
      const result = await getArtistMetrics()
      if (!result?.data?.data) {
        return []
      }
      return result.data.data
    }
  })
} 