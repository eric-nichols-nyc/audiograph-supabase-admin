
import { getArtists } from "@/actions/artist";


export const GET = async () => {

    console.log('Getting artists');
    // try catch call to action
    try {
        const result = await getArtists();

        if (!result || !result.data) {
            return new Response(JSON.stringify({ success: false, message: 'No data returned from getArtists' }), { status: 404 });
        }

        return new Response(JSON.stringify({ success: true, data: result.data.data }), { status: 200 });
    } catch (error) {
        console.error('Error loading artists:', error);
        return new Response(JSON.stringify({ success: false, message: 'Error loading artists' }), { status: 500 });
    }
};
