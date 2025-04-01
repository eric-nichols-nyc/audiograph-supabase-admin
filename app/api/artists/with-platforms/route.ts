import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        console.log('API Route: Starting to fetch artists with platforms');
        const supabase = await createClient();

        // First get artists that have similar artists
        console.log('API Route: Fetching similar artists');
        const { data: similarData, error: similarError } = await supabase
            .from('similar_artists')
            .select('artist1_id')
            .order('artist1_id');

        if (similarError) {
            console.error('API Route: Error fetching similar artists:', similarError);
            return Response.json({
                success: false,
                message: similarError.message
            }, { status: 500 });
        }

        // Get unique artist IDs that have similar artists
        const artistIdsWithSimilar = new Set(similarData.map(row => row.artist1_id));
        console.log('API Route: Found', artistIdsWithSimilar.size, 'artists with similar artists');

        // Get artists with their platform IDs
        console.log('API Route: Fetching artists with platform IDs');
        const { data: artists, error: artistError } = await supabase
            .from('artists')
            .select(`
                id,
                name,
                image_url,
                genres,
                country,
                artist_platform_ids (
                    platform,
                    platform_id
                )
            `)
            .order('name');

        if (artistError) {
            console.error('API Route: Error fetching artists:', artistError);
            return Response.json({
                success: false,
                message: artistError.message
            }, { status: 500 });
        }

        if (!artists) {
            console.error('API Route: No artists found');
            return Response.json({
                success: false,
                message: 'No artists found'
            }, { status: 404 });
        }

        console.log('API Route: Found', artists.length, 'artists');

        // Transform the data to include has_similar flag and organize platform IDs
        const transformedArtists = artists.map(artist => {
            const platformIds = artist.artist_platform_ids?.reduce((acc: Record<string, string>, curr: { platform: string, platform_id: string }) => {
                acc[curr.platform] = curr.platform_id;
                return acc;
            }, {}) || {};

            return {
                ...artist,
                has_similar: artistIdsWithSimilar.has(artist.id),
                platform_ids: {
                    spotify: platformIds['spotify'] || null,
                    youtube: platformIds['youtube'] || null,
                    deezer: platformIds['deezer'] || null,
                    genius: platformIds['genius'] || null,
                    yt_charts: platformIds['yt_charts'] || null,
                    musicbrainz: platformIds['musicbrainz'] || null,
                }
            };
        });

        console.log('API Route: Transformed', transformedArtists.length, 'artists');

        return Response.json({
            success: true,
            data: {
                artists: transformedArtists,
                count: transformedArtists.length,
                with_similar: artistIdsWithSimilar.size
            }
        }, { status: 200 });

    } catch (error) {
        console.error('API Route: Exception:', error);
        return Response.json({
            success: false,
            message: error instanceof Error ? error.message : 'Unknown error occurred'
        }, { status: 500 });
    }
} 