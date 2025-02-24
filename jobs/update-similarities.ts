import { ArtistSimilarityService } from '@/services/artist-similarity-service';

export async function updateStaleSimilarities() {
  const similarityService = new ArtistSimilarityService();
  await similarityService.updateStaleSimilarities(7); // 7 days threshold
} 