import { createClient } from '@supabase/supabase-js';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

interface SendNotificationParams {
  title: string;
  message: string;
  type: NotificationType;
  userId?: string; // Optional: for user-specific notifications
}

export async function sendNotification({ title, message, type, userId }: SendNotificationParams) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabase.from('notifications').insert({
      title,
      message,
      type,
      user_id: userId || null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Error sending notification:', error);
    }
  } catch (error) {
    console.error('Failed to send notification:', error);
  }
}
