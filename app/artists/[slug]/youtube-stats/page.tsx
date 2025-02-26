import { scrapeYouTubeCharts } from '@/services/youtube-charts-service';
import { getArtistBySlug } from '@/actions/artist';

export default async function YouTubeStatsPage({ params }: { params: { slug: string } }) {
  const { artist, platformIds } = await getArtistBySlug(params.slug);
  
  // Find YouTube platform ID
  const youtubeId = platformIds.find(p => p.platform === 'youtube')?.platform_id;
  
  let youtubeData = null;
  if (youtubeId) {
    youtubeData = await scrapeYouTubeCharts(youtubeId);
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">YouTube Stats</h1>
      
      {!youtubeId && (
        <div className="text-amber-600">
          No YouTube ID found for this artist
        </div>
      )}
      
      {youtubeData && (
        <div className="space-y-6">
          <div className="card p-4 border rounded-md">
            <h2 className="text-lg font-semibold">Subscribers</h2>
            <p className="text-2xl">{youtubeData.subscriberCount}</p>
          </div>
          
          {/* Display other scraped data */}
        </div>
      )}
    </div>
  );
} 