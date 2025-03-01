import { createClient } from '@/lib/supabase/server';
import { getUser } from '@/lib/supabase/auth/server';

export type NotificationType =
  | 'artist_added'
  | 'ranking_updated'
  | 'ranking_failed'
  | 'success'
  | 'error';

interface Notification {
  id: string;
  account_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority?: number;
  read_at?: string;
  expires_at?: string;
  metadata?: Record<string, any>;
  is_read?: boolean;
  created_at?: string;
  link?: string;
}

export class NotificationService {
  private async getAccountId(): Promise<string> {
    const user = await getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    return user.id;
  }

  async createNotification({
    type,
    title,
    message,
    priority = 0,
    metadata = {},
    expires_at,
    link,
  }: {
    type: NotificationType;
    title: string;
    message: string;
    priority?: number;
    metadata?: Record<string, any>;
    expires_at?: string;
    link?: string;
  }): Promise<string> {
    const accountId = await this.getAccountId();

    try {
      const supabase = await createClient();

      const { data, error } = await supabase
        .from('notifications')
        .upsert([
          { account_id: accountId, type, title, message, priority, metadata, expires_at, link },
        ])
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async getUnreadNotifications(): Promise<Notification[]> {
    const accountId = await this.getAccountId();
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('account_id', accountId)
        .eq('is_read', false)
        .is('read_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    const accountId = await this.getAccountId();
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('account_id', accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async sendNotification() {
    const user = await getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }
    // Use user.id for notifications
  }
}
