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
        console.log('use artist metrics hook - raw result:', JSON.stringify(result, null, 2));

        // Extract the metrics array from the result
        let metricsArray: ArtistMetric[] = [];

        console.log('use artist metrics hook - result structure:', {
          hasData: !!result?.data,
          dataType: typeof result?.data,
          isDataArray: Array.isArray(result?.data),
          hasNestedData: result?.data && typeof result.data === 'object' && 'data' in result.data,
          isNestedDataArray: result?.data && typeof result.data === 'object' && 'data' in result.data && Array.isArray(result.data.data)
        });

        if (Array.isArray(result?.data)) {
          // If result.data is already an array of metrics
          metricsArray = result.data;
          console.log('use artist metrics hook - using result.data as array, length:', result.data.length);
        } else if (result?.data && typeof result.data === 'object' && 'data' in result.data && Array.isArray(result.data.data)) {
          // If result.data.data is an array of metrics
          metricsArray = result.data.data;
          console.log('use artist metrics hook - using result.data.data as array, length:', result.data.data.length);
        } else {
          console.log('use artist metrics hook - could not extract metrics array from result');
        }

        // Create the response with the expected structure
        const response: MetricsResponse = {
          data: {
            data: metricsArray
          }
        };

        console.log('use artist metrics hook - final response structure:', JSON.stringify(response, null, 2));
        return response;
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
