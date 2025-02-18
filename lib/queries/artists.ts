import { useQuery } from '@tanstack/react-query';
import { Artist } from '@/types/artists';

async function fetchArtists() {
  const response = await fetch('/api/artists');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export function useArtists() {
  return useQuery<Artist[]>({
    queryKey: ['artists'],
    queryFn: fetchArtists,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
} 