import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getArtistMetrics } from '@/actions/artist'
import { ArtistMetric } from '@/types/artists'

interface MetricsResponse {
  data: ArtistMetric[]
}

export function useArtistMetrics() {
  const queryClient = useQueryClient()

  const query = useQuery<MetricsResponse>({
    queryKey: ['artist-metrics'],
    queryFn: async () => {
      const result = await getArtistMetrics()
      
      if (!result?.data || !Array.isArray(result.data)) {
        return { data: [] as ArtistMetric[] }
      }

      return { data: result.data as ArtistMetric[] }
    }
  })

  return {
    ...query,
    mutate: () => queryClient.invalidateQueries({ queryKey: ['artist-metrics'] })
  }
} 