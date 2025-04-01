import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { platform, platform_id } = await request.json();

        // Validate required fields
        if (!platform || !platform_id) {
            return Response.json({
                success: false,
                message: "Platform and platform_id are required"
            }, { status: 400 });
        }

        // Validate platform is one of the allowed values
        const allowedPlatforms = ['spotify', 'youtube', 'deezer', 'genius', 'yt_charts', 'musicbrainz'];
        if (!allowedPlatforms.includes(platform)) {
            return Response.json({
                success: false,
                message: `Platform must be one of: ${allowedPlatforms.join(', ')}`
            }, { status: 400 });
        }

        const supabase = await createClient();

        // First check if a platform ID already exists for this artist
        const { data: existingData, error: existingError } = await supabase
            .from('artist_platform_ids')
            .select('id')
            .eq('artist_id', params.id)
            .eq('platform', platform)
            .single();

        if (existingError && existingError.code !== 'PGRST116') { // PGRST116 is "not found" error
            console.error('Error checking existing platform ID:', existingError);
            return Response.json({
                success: false,
                message: existingError.message
            }, { status: 500 });
        }

        let result;
        if (existingData) {
            // Update existing record
            const { data, error } = await supabase
                .from('artist_platform_ids')
                .update({
                    platform_id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existingData.id)
                .select()
                .single();

            result = { data, error };
        } else {
            // Insert new record
            const { data, error } = await supabase
                .from('artist_platform_ids')
                .insert({
                    artist_id: params.id,
                    platform,
                    platform_id
                })
                .select()
                .single();

            result = { data, error };
        }

        if (result.error) {
            console.error('Error updating platform ID:', result.error);
            return Response.json({
                success: false,
                message: result.error.message
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            data: result.data
        });

    } catch (error) {
        console.error('Exception in route:', error);
        return Response.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
} 