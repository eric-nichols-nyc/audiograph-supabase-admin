import { NextRequest, NextResponse } from 'next/server';
import { LocationResponse, LocationData } from '@/utils/location-data';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const { slug } = params;

    // First, try to get data from the database
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('id, name')
      .eq('slug', slug)
      .single();

    if (artistError) {
      console.error('Error fetching artist:', artistError);
      throw new Error('Artist not found');
    }

    // Try to get location data from the database
    const { data: locationData, error: locationError } = await supabase
      .from('artist_location_metrics')
      .select('*')
      .eq('artist_id', artistData.id)
      .order('rank', { ascending: true })
      .limit(15);

    let topLocations: LocationData[] = [];

    if (!locationError && locationData && locationData.length > 0) {
      // If we have data in the database, use it
      topLocations = locationData.map(location => ({
        rank: location.rank.toString(),
        title: location.location_name,
        views: location.views_count,
      }));
    } else {
      // If no data in database or there was an error, use mock data for The Weeknd
      // In a real implementation, you would trigger a scrape job here
      if (slug === 'the-weeknd') {
        // Mock data for The Weeknd
        topLocations = [
          { rank: '1', title: 'Mexico City', views: '2.39M views' },
          { rank: '2', title: 'Jakarta', views: '2.16M views' },
          { rank: '3', title: 'Lima', views: '1.50M views' },
          { rank: '4', title: 'Santiago', views: '1.48M views' },
          { rank: '5', title: 'São Paulo', views: '1.47M views' },
          { rank: '6', title: 'London', views: '1.40M views' },
          { rank: '7', title: 'Bangkok', views: '1.38M views' },
          { rank: '8', title: 'Kuala Lumpur', views: '1.37M views' },
          { rank: '9', title: 'Bogotá', views: '1.37M views' },
          { rank: '10', title: 'İstanbul', views: '1.22M views' },
          { rank: '11', title: 'New York', views: '1.16M views' },
          { rank: '12', title: 'Seoul', views: '1.12M views' },
          { rank: '13', title: 'Paris', views: '1.04M views' },
          { rank: '14', title: 'Buenos Aires', views: '1.02M views' },
          { rank: '15', title: 'Milan', views: '936K views' },
        ];
      }
    }

    // Return the response
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      artistSlug: slug,
      artistName: artistData.name,
      topLocations,
    });
  } catch (error) {
    console.error('Error fetching artist location data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch artist location data',
      },
      { status: 500 }
    );
  }
}
