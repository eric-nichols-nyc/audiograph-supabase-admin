import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Artist, SimilarArtist } from '@/types/artists';

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

interface SimilarArtistsResponse {
  success: boolean;
  data?: any;
  message?: string;
}

interface MutationContext {
  previousArtists: Artist[] | undefined;
}

// Add mutation for similar artists
export function useSimilarArtistsMutation() {
  const queryClient = useQueryClient();

  return useMutation<SimilarArtistsResponse, Error, string, MutationContext>({
    mutationFn: async (artistId: string) => {
      const response = await fetch(`/api/artist/${artistId}/generate-similar-artists`, {
        method: 'POST'
      });
      return response.json();
    },
    onMutate: async (artistId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['artists'] });

      // Snapshot the previous value
      const previousArtists = queryClient.getQueryData<Artist[]>(['artists']);

      // Optimistically update the has_similar flag
      queryClient.setQueryData<Artist[]>(['artists'], (old = []) =>
        old.map(artist =>
          artist.id === artistId
            ? { ...artist, has_similar: true }
            : artist
        )
      );

      return { previousArtists };
    },
    onError: (err, artistId, context) => {
      if (context?.previousArtists) {
        queryClient.setQueryData<Artist[]>(['artists'], context.previousArtists);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] });
    }
  });
}

// Add query for fetching similar artists
export function useSimilarArtists(artistId: string | null | undefined) {
  return useQuery<SimilarArtist[]>({
    queryKey: ['similar-artists', artistId],
    queryFn: async () => {
      if (!artistId) return [];
      const response = await fetch(`/api/artist/${artistId}/similar-artists`);
      if (!response.ok) {
        throw new Error('Failed to fetch similar artists');
      }
      const data = await response.json();
      return data.data || [];
    },
    enabled: !!artistId, // Only run query if artistId exists
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
} 