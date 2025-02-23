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
        return result || { data: { data: [] } };
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