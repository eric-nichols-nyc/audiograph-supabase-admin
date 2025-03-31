import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export const GET = async (request: Request) => {
    try {
        const supabase = await createClient();

        // Get all unique artist1_ids from similar_artists
        const { data: similarData, error: similarError } = await supabase
            .from('similar_artists')
            .select('artist1_id')
            .order('artist1_id');

        if (similarError) {
            console.error('Error fetching similar artists:', similarError);
            return new Response(
                JSON.stringify({
                    success: false,
                    message: similarError.message
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // Get unique IDs from similar_artists
        const uniqueIds = Array.from(new Set(similarData.map(row => row.artist1_id)));

        // Get the actual artist data for these IDs
        const { data: artists, error: artistError } = await supabase
            .from('artists')
            .select('*')
            .in('id', uniqueIds)
            .order('name');

        if (artistError) {
            console.error('Error fetching artists:', artistError);
            return new Response(
                JSON.stringify({
                    success: false,
                    message: artistError.message
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    artists: artists || [],
                    count: artists?.length || 0
                }
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    } catch (error) {
        console.error('Exception in route:', error);
        return new Response(
            JSON.stringify({
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred'
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}; 