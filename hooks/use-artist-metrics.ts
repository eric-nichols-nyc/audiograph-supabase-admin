import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getArtistMetrics } from '@/actions/artist'
import { ArtistMetric } from '@/types/artists'

interface MetricsResponse {
  data: {
    data: ArtistMetric[];
  };
}

export function useArtistMetrics() {
  const queryClient = useQueryClient()

  const query = useQuery<MetricsResponse>({
    queryKey: ['artist-metrics'],
    queryFn: async () => {
      try {
        const result = await getArtistMetrics();
        // The error is that the return type of getArtistMetrics() doesn't match MetricsResponse
        // getArtistMetrics returns SafeActionResult type but we need MetricsResponse
        // We need to transform the result to match MetricsResponse type
        return {
          data: {
            data: result?.data?.data || []
          }
        };
      } catch (error) {
        console.error('Error fetching metrics:', error);
        return { data: { data: [] } };
      }
    }
    })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutate: () => queryClient.invalidateQueries({ queryKey: ['artist-metrics'] })
  };
} 