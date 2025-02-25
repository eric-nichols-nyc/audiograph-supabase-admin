// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface YoutubeData {
  name: string;
  youtube_channel_id: string;
}

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the data from the request body
    const youtubeData: YoutubeData[] = await req.json()
    const results: { name: string; status: string; message?: string }[] = []

    for (const artist of youtubeData) {
      try {
        // First get the artist ID from the name
        const { data: artistData, error: artistError } = await supabase
          .from("artists")
          .select("id")
          .eq("name", artist.name)
          .single()

        if (artistError || !artistData) {
          results.push({ 
            name: artist.name, 
            status: 'error', 
            message: `Artist not found: ${artistError?.message || 'No matching artist'}` 
          })
          continue
        }

        // Upsert the platform ID
        const { error: platformError } = await supabase
          .from("artist_platform_ids")
          .upsert({
            artist_id: artistData.id,
            platform: 'youtube',
            platform_id: artist.youtube_channel_id
          }, {
            onConflict: 'artist_id,platform'
          })

        if (platformError) {
          results.push({ 
            name: artist.name, 
            status: 'error', 
            message: `Failed to update platform ID: ${platformError.message}` 
          })
          continue
        }

        results.push({ 
          name: artist.name, 
          status: 'success' 
        })
      } catch (error) {
        results.push({ 
          name: artist.name, 
          status: 'error', 
          message: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    const successful = results.filter(r => r.status === 'success')
    const failed = results.filter(r => r.status === 'error')

    return new Response(JSON.stringify({
      message: `Processed ${results.length} artists. ${successful.length} successful, ${failed.length} failed.`,
      results
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({ 
      error: 'Failed to process YouTube IDs',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/* To invoke locally:
  1. Save your JSON data to a file named youtube-data.json
  2. Run `supabase start`
  3. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/import-youtube-ids' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data @youtube-data.json
*/ 