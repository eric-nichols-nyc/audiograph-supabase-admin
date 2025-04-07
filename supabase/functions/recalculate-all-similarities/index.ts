import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

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

        // Get total count of artists
        const { data: countData, error: countError } = await supabaseClient
            .from('artists')
            .select('count', { count: 'exact', head: true })

        if (countError) {
            throw new Error(`Error getting artist count: ${countError.message}`)
        }

        const totalArtists = countData || 0
        console.log(`Found ${totalArtists} artists to process`)

        // Clear existing similarities to prevent stale data
        const { error: clearError } = await supabaseClient
            .from('similar_artists')
            .delete()
            .neq('artist1_id', 'dummy') // Delete all rows

        if (clearError) {
            throw new Error(`Error clearing existing similarities: ${clearError.message}`)
        }

        console.log('Cleared existing similarities')

        // Call the calculate-artist-similarities function with a large enough limit
        const { data, error } = await supabaseClient.functions.invoke('calculate-artist-similarities', {
            body: { limit: totalArtists }
        })

        if (error) {
            throw new Error(`Error calculating similarities: ${error.message}`)
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Recalculated all artist similarities',
                result: data
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Function error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
}) 