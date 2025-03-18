// hooks/use-artists.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getArtists } from '@/actions/artist';
import { Artist } from '@/types/artists';

interface ArtistsResponse {
  data: {
    data: Artist[];
  };
}

export function useArtists() {
  const queryClient = useQueryClient();

  const query = useQuery<ArtistsResponse>({
    queryKey: ['artists'],
    queryFn: async () => {
      try {
        const result = await getArtists();
        console.log('use artists hook - raw result:', JSON.stringify(result, null, 2));

        // Check the structure of result.data
        if (result?.data) {
          console.log('use artists hook - result.data type:', typeof result.data);
          console.log('use artists hook - result.data is array:', Array.isArray(result.data));

          if (typeof result.data === 'object' && !Array.isArray(result.data)) {
            console.log('use artists hook - result.data keys:', Object.keys(result.data));

            // Check if result.data has a data property
            if ('data' in result.data) {
              console.log('use artists hook - result.data.data type:', typeof result.data.data);
              console.log('use artists hook - result.data.data is array:', Array.isArray(result.data.data));
            }
          }
        }

        // Extract the artists array from the result
        let artistsArray: Artist[] = [];

        console.log('use artists hook - result structure:', {
          hasData: !!result?.data,
          dataType: typeof result?.data,
          isDataArray: Array.isArray(result?.data),
          hasNestedData: result?.data && typeof result.data === 'object' && 'data' in result.data,
          isNestedDataArray: result?.data && typeof result.data === 'object' && 'data' in result.data && Array.isArray(result.data.data)
        });

        if (Array.isArray(result?.data)) {
          // If result.data is already an array of artists
          artistsArray = result.data;
          console.log('use artists hook - using result.data as array, length:', result.data.length);
        } else if (result?.data && typeof result.data === 'object' && 'data' in result.data && Array.isArray(result.data.data)) {
          // If result.data.data is an array of artists
          artistsArray = result.data.data;
          console.log('use artists hook - using result.data.data as array, length:', result.data.data.length);
        } else {
          console.log('use artists hook - could not extract artists array from result');
        }

        // Create the response with the expected structure
        const response: ArtistsResponse = {
          data: {
            data: artistsArray
          }
        };

        console.log('use artists hook - final response structure:', JSON.stringify(response, null, 2));
        return response;
      } catch (error) {
        console.error('Error fetching artists:', error);
        return { data: { data: [] } };
      }
    }
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    mutate: () => queryClient.invalidateQueries({ queryKey: ['artists'] })
  };
}
