// hooks/use-artists.ts
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getArtists } from '@/actions/artist';
import { Artist } from '@/types/artists';

export function useArtists() {
  const queryClient = useQueryClient();

  const query = useQuery<{ data: { data: Artist[] } }>({
    queryKey: ['artists'],
    queryFn: async () => {
      const result = await getArtists();
      return result;
    }
  });

  return {
    ...query,
    mutate: () => queryClient.invalidateQueries({ queryKey: ['artists'] })
  };
}