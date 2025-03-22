import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * This edge function is designed to be triggered by a Supabase webhook
 * when an artist is added to the database. It extracts the artist ID
 * from the webhook payload and calls the calculate-artist-similarities
 * edge function to calculate similarities for the newly added artist.
 */
serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // Create a Supabase client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: { headers: { Authorization: req.headers.get('Authorization')! } },
            }
        )

        // Parse webhook payload
        const payload = await req.json()
        console.log('Received webhook payload:', JSON.stringify(payload, null, 2))

        // Extract artist ID from the payload
        // For INSERT webhooks, the new record is in payload.record
        const artistId = payload.record?.id

        if (!artistId) {
            console.error('No artist ID found in webhook payload')
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'No artist ID found in webhook payload'
                }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        console.log(`Triggering similarity calculation for artist ID: ${artistId}`)

        // Call the calculate-artist-similarities edge function
        const { data, error } = await supabaseClient.functions.invoke(
            'calculate-artist-similarities',
            {
                body: { specificArtistId: artistId }
            }
        )

        if (error) {
            console.error('Error calling calculate-artist-similarities:', error)
            return new Response(
                JSON.stringify({
                    success: false,
                    error: error.message
                }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Successfully calculated similarities for artist ID: ${artistId}`,
                result: data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({
                success: false,
                error: error.message
            }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
