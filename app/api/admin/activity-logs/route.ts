import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get recent activity logs, limited to 20 most recent entries
    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) {
      throw error;
    }

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
  }
}
