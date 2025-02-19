import { createClient } from "@/utils/supabase/server";
import { actionClient } from "@/lib/safe-action";
import { addArtistFullSchema } from "@/schemas/artist-full-schema"; // Adjust path as needed
import { scrapeAndStoreWikipedia } from '@/services/wikipedia-service';

export const addFullArtist = actionClient
  .schema(addArtistFullSchema)
  .action(async ({ parsedInput }) => {
    try {
      console.log('Validating input with schema...');
      const validationResult = addArtistFullSchema.safeParse(parsedInput);
      
      if (!validationResult.success) {
        const formattedErrors = validationResult.error.format();
        
        // Log specific video errors with full details
        if (formattedErrors.videos) {
          console.log('Video validation errors:');
          Object.entries(formattedErrors.videos).forEach(([index, error]) => {
            console.log(`Video at index ${index}:`, JSON.stringify(error, null, 2));
          });

          // Log a sample of the actual video data
          if (parsedInput.videos && parsedInput.videos[0]) {
            console.log('Sample video data structure:', {
              firstVideo: parsedInput.videos[0],
              expectedSchema: {
                video_id: 'string',
                title: 'string',
                platform: 'string',
                view_count: 'number',
                daily_view_count: 'number',
                published_at: 'string',
                thumbnail_url: 'string (optional)'
              }
            });
          }
        }

        return { 
          validationErrors: JSON.parse(JSON.stringify(formattedErrors)) 
        };
      }

      console.log('Input validation passed:', {
        artist: parsedInput.artist,
        platformDataCount: parsedInput.platformData.length,
        metricDataCount: parsedInput.metricData.length,
        tracksCount: parsedInput.tracks.length,
        videosCount: parsedInput.videos.length,
      });

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            message: 'Full artist retrieved',
            artist: {
              id: '1',
              name: 'John Doe',
              slug: 'john-doe',
              is_complete: true
            }
          });
        }, 3000);
      });
    } catch (error) {
      console.error('Error in addFullArtist:', error);
      throw error;
    }
  });
