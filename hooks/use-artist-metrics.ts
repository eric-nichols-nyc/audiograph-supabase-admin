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
      try {
        const result = await getArtistMetrics();
        return result || { data: [] };
      } catch (error) {
        console.error('Error fetching metrics:', error);
        return { data: [] };
      }
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutate: () => queryClient.invalidateQueries({ queryKey: ['artist-metrics'] })
  };
} 