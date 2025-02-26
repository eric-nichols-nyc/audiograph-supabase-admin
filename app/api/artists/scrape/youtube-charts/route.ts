import { NextRequest, NextResponse } from 'next/server';
import { getYoutubeChartsArtistId } from '@/services/youtube-charts-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Add this to prevent caching

/**
 * API route to fetch YouTube Charts artist ID
 * 
 * @param request The incoming request
 * @returns JSON response with YouTube Charts artist data
 */
export async function GET(request: NextRequest) {
  console.log("YouTube Charts API route called");
  
  try {
    // Get artist name from query parameters
    const searchParams = request.nextUrl.searchParams;
    const artistName = searchParams.get('name');

    if (!artistName) {
      console.log("Missing artist name parameter");
      return NextResponse.json(
        { error: 'Artist name is required' },
        { status: 400 }
      );
    }

    console.log(`API: Fetching YouTube Charts data for artist: ${artistName}`);
    
    // Call the service to get the YouTube Charts artist ID
    const result = await getYoutubeChartsArtistId(artistName);
    console.log("YouTube Charts API result:", result);

    if (!result.success) {
      return NextResponse.json(
        { 
          error: result.error || 'Failed to fetch YouTube Charts data',
          details: result
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('Error in YouTube Charts API route:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 