import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const { artist_id, platform, platform_id } = await request.json();

    // Validate input
    if (!artist_id || !platform || !platform_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Update the platform ID
    const { data, error } = await supabase
      .from('artist_platform_ids')
      .upsert({
        artist_id,
        platform,
        platform_id
      }, {
        onConflict: 'artist_id,platform'
      });

    if (error) throw error;

    return NextResponse.json({
      message: 'Platform ID updated successfully',
      data
    });

  } catch (error) {
    console.error('Error updating platform ID:', error);
    return NextResponse.json(
      { error: 'Failed to update platform ID' },
      { status: 500 }
    );
  }
} 