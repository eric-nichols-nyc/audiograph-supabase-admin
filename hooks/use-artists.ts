// hooks/use-artists.ts
import { useQuery } from '@tanstack/react-query';
import { getArtists } from '@/actions/artist';

export function useArtists() {
  return useQuery({
    queryKey: ['artists'],
    queryFn: () => getArtists()
  });
}