import { createClient } from '@supabase/supabase-js';

type ActivityType = 'success' | 'error' | 'warning' | 'info';
type Platform = 'spotify' | 'youtube' | 'system';

interface LogActivityParams {
  type: ActivityType;
  message: string;
  platform: Platform;
  details?: string;
}

export async function logActivity({ type, message, platform, details }: LogActivityParams) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for server-side operations
    );

    const { error } = await supabase.from('activity_logs').insert({
      type,
      message,
      platform,
      details,
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error('Error logging activity:', error);
    }
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
