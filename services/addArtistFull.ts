import { createClient } from "@/utils/supabase/server";
import { actionClient } from "@/lib/safe-action";
import { addArtistFullSchema } from "@/schemas/addArtistFullSchema"; // Adjust path as needed

export const addArtistFull = actionClient
  .schema(addArtistFullSchema)
  .action(async ({ parsedInput }) => {
    console.log('addFullArtist parsedInput ', parsedInput);
    // Destructure the parsed input
    const { artist, platformData, urlData, metricData, tracks, videos } = parsedInput;
    
    // Example: Get aggregated data from multiple sources
    const fullArtistData = parsedInput;

    const supabase = await createClient();

    // Begin transaction (requires corresponding RPC functions in your database)
    const { error: txBeginError } = await supabase.rpc("begin_transaction");
    if (txBeginError) {
      throw new Error(`Failed to begin transaction: ${txBeginError.message}`);
    }

    try {
      // Insert artist record and retrieve the inserted record (assumes the inserted row is returned)
      const { data: artistData, error: artistError } = await supabase
        .from("artists")
        .insert(artist)
        .select()
        .single();
      if (artistError) {
        throw new Error(`Error inserting artist: ${artistError.message}`);
      }

      // Use the generated artist id for all subsequent inserts
      const artistId = artistData.id;
      console.log('artistId = ', artistId);

      // Insert platform data
      for (const platform of platformData) {
        const platformInsert = { ...platform, artist_id: artistId };
        const { error: platformError } = await supabase
          .from("artist_platform_ids")
          .insert(platformInsert);
        if (platformError) {
          throw new Error(`Error inserting artist platform: ${platformError.message}`);
        }
      }

      console.log('platformData = ', platformData);

      // Insert URL data
      for (const url of urlData) {
        const urlInsert = { ...url, artist_id: artistId };
        const { error: urlError } = await supabase
          .from("artist_urls")
          .insert(urlInsert);
        if (urlError) {
          throw new Error(`Error inserting artist URL: ${urlError.message}`);
        }
      }

      console.log('urlData = ', urlData);

      // Insert metric data
      for (const metric of metricData) {
        const metricInsert = { ...metric, artist_id: artistId };
        const { error: metricError } = await supabase
          .from("artist_metrics")
          .insert(metricInsert);
        if (metricError) {
          throw new Error(`Error inserting artist metric: ${metricError.message}`);
        }
      }

      console.log('metricData = ', metricData);

      // Insert tracks and create artist_tracks entries
      if (tracks && tracks.length > 0) {
        for (const track of tracks) {
          // Upsert the track
          const { data: trackResult, error: trackError } = await supabase
            .from("tracks")
            .upsert({
              track_id: track.track_id, 
              title: track.title,
              platform: track.platform,
              thumbnail_url: track.thumbnail_url,
              stream_count_total: track.stream_count_total,
              stream_count_daily: track.stream_count_daily, // Renamed to match schema
            }, {
              onConflict: 'platform,track_id'
            })
            .select('id')
            .single();
      
          if (trackError) throw new Error(`Track upsert error: ${trackError.message}`);
          
          // Insert or update the artist-track relationship
          const { error: artistTrackError } = await supabase
            .from("artist_tracks")
            .upsert({ 
              artist_id: artistId, 
              track_id: trackResult.id,
              role: 'primary' // or whatever role is appropriate
            }, {
              onConflict: 'artist_id,track_id'
            });
      
          if (artistTrackError) throw new Error(`Artist-track relation error: ${artistTrackError.message}`);
        }
      }
      

      // Insert videos and create artist_videos entries
      if (videos && videos.length > 0) {
        for (const video of videos) {
          // Upsert the video to avoid duplicates based on platform and video_id
          const { data: videoResult, error: videoError } = await supabase
            .from("videos")
            .upsert({
              video_id: video.video_id,
              title: video.title,
              platform: video.platform,
              view_count: video.view_count,
              monthly_view_count: video.monthly_view_count,
              published_at: video.published_at,
              thumbnail_url: video.thumbnail_url,
            }, {
              onConflict: 'platform,video_id'
            })
            .select('id')
            .single();

          if (videoError) throw new Error(`Video upsert error: ${videoError.message}`);

          // Upsert the artist video relationship using the obtained video id
          const { error: artistVideoError } = await supabase
            .from("artist_videos")
            .upsert({ artist_id: artistId, video_id: videoResult.id }, {
              onConflict: 'artist_id,video_id'
            });
          if (artistVideoError) throw new Error(`Artist video relation error: ${artistVideoError.message}`);
        }
      }

      console.log('videos = ', videos);

      // Commit transaction if all operations succeed
      const { error: txCommitError } = await supabase.rpc("commit_transaction");
      if (txCommitError) {
        throw new Error(`Failed to commit transaction: ${txCommitError.message}`);
      }

      return fullArtistData;
    } catch (error) {
      // Rollback the transaction in case of any error
      await supabase.rpc("rollback_transaction");
      throw error;
    }
  }); 