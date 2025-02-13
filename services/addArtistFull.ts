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

      // Insert tracks and create artist_tracks entries
      if (tracks && tracks.length > 0) {
        for (const track of tracks) {
          const { error: trackError } = await supabase
            .from("tracks")
            .insert(track);
          if (trackError) throw new Error(trackError.message);

          const { error: artistTrackError } = await supabase
            .from("artist_tracks")
            .insert({ artist_id: artistId, track_id: track.track_id });
          if (artistTrackError) throw new Error(artistTrackError.message);
        }
      }

      // Insert videos and create artist_videos entries
      if (videos && videos.length > 0) {
        for (const video of videos) {
          const { error: videoError } = await supabase
            .from("videos")
            .insert(video);
          if (videoError) throw new Error(videoError.message);

          const { error: artistVideoError } = await supabase
            .from("artist_videos")
            .insert({ artist_id: artistId, video_id: video.video_id });
          if (artistVideoError) throw new Error(artistVideoError.message);
        }
      }

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