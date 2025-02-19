import { createClient } from "@/utils/supabase/server";
import { actionClient } from "@/lib/safe-action";
import { addArtistFullSchema } from "@/schemas/artists"; // Adjust path as needed
import { scrapeAndStoreWikipedia } from '@/services/wikipedia-service';
import { Track, Video } from "@/types/artists";

export const addFullArtist = actionClient
  .schema(addArtistFullSchema)
  .action(async ({ parsedInput }) => {
    console.log('Starting database insertion with:', {
      artistName: parsedInput.artist.name,
      dataStats: {
        platforms: parsedInput.platformData.length,
        metrics: parsedInput.metricData.length,
        tracks: parsedInput.tracks.length,
        videos: parsedInput.videos.length
      }
    });

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
        try {
          const platformInsert = { 
            artist_id: artistId,
            platform: platform.platform  // Just use the platform name (youtube/spotify)
          };
          const { error: platformError } = await supabase
            .from("artist_platform_ids")
            .insert(platformInsert);
          if (platformError) {
            console.error('Platform insert error:', platformError);
            await supabase.rpc("rollback_transaction");
            throw new Error(`Error inserting artist platform: ${platformError.message}`);
          }
        } catch (error) {
          console.error('Error in platform insert:', error);
          await supabase.rpc("rollback_transaction");
          throw error;
        }
      }
      // Insert URL data
      // for (const url of urlData) {
      //   const urlInsert = { ...url, artist_id: artistId };
      //   const { error: urlError } = await supabase
      //     .from("artist_urls")
      //     .insert(urlInsert);
      //   if (urlError) {
      //     throw new Error(`Error inserting artist URL: ${urlError.message}`);
      //   }
      // }
      // Insert metric data
      for (const metric of metricData) {
        const metricInsert = { ...metric, artist_id: artistId };
        const { data: metricResult, error: metricError } = await supabase
          .from("artist_metrics")
          .insert(metricInsert)
          .select('id')
          .single();
        if (metricError) {
          throw new Error(`Error inserting artist metric: ${metricError.message}`);
        }
      }

      console.log('artist_metrics added');


      // Insert tracks and create artist_tracks entries
      if (tracks && tracks.length > 0) {
        for (const track of tracks as Track[]) {
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

          if (artistTrackError){
            console.error('Artist-track relation error:', artistTrackError);
            await supabase.rpc("rollback_transaction");
            throw new Error(`Artist-track relation error: ${artistTrackError.message}`);
          }
        }
      }
      console.log('tracks and artist_tracks added');


      // Insert videos and create artist_videos entries
      if (videos && videos.length > 0) {
        for (const video of videos as Video[]) {
          console.log('Inserting video:', {
            video_id: video.video_id,
            title: video.title,
            platform: video.platform
          });

          const { data: videoResult, error: videoError } = await supabase
            .from("videos")
            .upsert({
              video_id: video.video_id,
              title: video.title,
              platform: video.platform,
              view_count: video.view_count,
              daily_view_count: video.daily_view_count,
              published_at: video.published_at,
              thumbnail_url: video.thumbnail_url,
            }, {
              onConflict: 'platform,video_id'
            })
            .select('id')
            .single();

          if (videoError) {
            console.error('Video insertion error:', videoError);
            await supabase.rpc("rollback_transaction");
            throw new Error(`Video upsert error: ${videoError.message}`);
          }
          console.log('Video inserted:', videoResult);

          // Create artist-video relationship
          const { error: artistVideoError } = await supabase
            .from("artist_videos")
            .upsert({ 
              artist_id: artistId, 
              video_id: videoResult.id  // Use video_id directly
            }, {
              onConflict: 'artist_id,video_id'
            });

          if (artistVideoError){
            console.error('Artist video relation error:', artistVideoError);
            await supabase.rpc("rollback_transaction");
            throw new Error(`Artist video relation error: ${artistVideoError.message}`);
          }
        }
      }

      console.log('videos and artist_videos added');

      // Commit transaction if all operations succeed
      const { error: txCommitError } = await supabase.rpc("commit_transaction");
      if (txCommitError) {
        throw new Error(`Failed to commit transaction: ${txCommitError.message}`);
      }

      // NEW: Trigger Wikipedia service after commit using artist name and artistId.
      try {
        await scrapeAndStoreWikipedia(artist.name, artistId);
        console.log('Wikipedia service completed');
      } catch (wikiError) {
        console.error("Error in Wikipedia service:", wikiError);
        // Ideally, we should not rollback here since the main transaction is already committed.
        // Instead, log the error and consider scheduling a retry or marking the record for update.
      }
      console.log('Wikipedia service completed');

      // set artist isComplete to true and throw an error if it fails
      const { error: updateError } = await supabase
        .from("artists")
        .update({ is_complete: true })
        .eq("id", artistId);
      if (updateError) {
        throw new Error(`Error updating artist is_complete: ${updateError.message}`);
      }

      console.log('artist is_complete updated to true');

      // Now query the database for the inserted artist with related data.
      const { data: insertedArtist, error: fetchError } = await supabase
        .from("artists")
        .select(`
          *,
          artist_platform_ids(*),
          artist_urls(*),
          artist_metrics(*),
          artist_tracks(*),
          artist_videos(*)
        `)
        .eq("id", artistId)
        .single();

      if (fetchError) {
        throw new Error(`Error fetching inserted artist: ${fetchError.message}`);
      }

      return insertedArtist;
    } catch (error) {
      // Rollback the transaction in case of any error during the database operations
      await supabase.rpc("rollback_transaction");
      throw error;
    }
  }); 