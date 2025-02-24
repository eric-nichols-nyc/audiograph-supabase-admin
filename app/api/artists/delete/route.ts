import { createClient } from "@/lib/supabase/server";

export async function DELETE(request: Request) {
  try {
    // Assumes the artist id is supplied in the JSON body.
    const { id } = await request.json();
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Artist id is required" }),
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Begin transaction (RPC functions must be defined in your DB)
    const { error: txBeginError } = await supabase.rpc("begin_transaction");
    if (txBeginError) {
      throw new Error(`Failed to begin transaction: ${txBeginError.message}`);
    }

    try {
      // Delete related records first. If your DB uses ON DELETE CASCADE, you may skip these steps.

      // Artist Platform IDs
      const { error: platformError } = await supabase
        .from("artist_platform_ids")
        .delete()
        .eq("artist_id", id);
      if (platformError) throw new Error(platformError.message);

      // Artist URLs
      const { error: urlError } = await supabase
        .from("artist_urls")
        .delete()
        .eq("artist_id", id);
      if (urlError) throw new Error(urlError.message);

      // Artist Metrics
      const { error: metricError } = await supabase
        .from("artist_metrics")
        .delete()
        .eq("artist_id", id);
      if (metricError) throw new Error(metricError.message);

      // Tracks (assuming tracks are linked to the artist via artist_id)
      const { error: tracksError } = await supabase
        .from("artist_tracks")
        .delete()
        .eq("artist_id", id);
      if (tracksError) throw new Error(tracksError.message);

      // Videos
      const { error: videosError } = await supabase
        .from("artist_videos")
        .delete()
        .eq("artist_id", id);
      if (videosError) throw new Error(videosError.message);

      // Artist Tracks (if applicable)
      const { error: artistTracksError } = await supabase
        .from("artist_tracks")
        .delete()
        .eq("artist_id", id);
      if (artistTracksError) throw new Error(artistTracksError.message);

      // Artist Videos (if applicable)
      const { error: artistVideosError } = await supabase
        .from("artist_videos")
        .delete()
        .eq("artist_id", id);
      if (artistVideosError) throw new Error(artistVideosError.message);

      // Finally, delete the artist record itself
      const { error: artistError } = await supabase
        .from("artists")
        .delete()
        .eq("id", id);
      if (artistError) throw new Error(artistError.message);

      // Commit transaction if all operations succeed
      const { error: txCommitError } = await supabase.rpc("commit_transaction");
      if (txCommitError) {
        throw new Error(`Failed to commit transaction: ${txCommitError.message}`);
      }

      return new Response(
        JSON.stringify({ message: "Artist deleted successfully.", id }),
        { status: 200 }
      );
    } catch (error) {
      // Rollback transaction if any operation fails
      await supabase.rpc("rollback_transaction");
      throw error;
    }
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
    });
  }
}
