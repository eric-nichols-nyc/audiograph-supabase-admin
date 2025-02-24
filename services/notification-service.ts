import { createClient } from '@/lib/supabase/server';

export type NotificationType = 'artist_added' | 'ranking_updated' | 'ranking_failed' | 'success' | 'error';

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
  constructor(private readonly accountId: string) {}

  async createNotification({
    type,
    title,
    message,
    priority = 0,
    metadata = {},
    expires_at,
    link
  }: {
    type: NotificationType;
    title: string;
    message: string;
    priority?: number;
    metadata?: Record<string, any>;
    expires_at?: string;
    link?: string;
  }): Promise<string> {
    try {
      const supabase = await createClient();
    
      const { data, error } = await supabase
        .from('notifications')
        .upsert([{
          account_id: this.accountId,
          type,
          title,
          message,
          priority,
          metadata,
          expires_at,
          link
        }])
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
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('account_id', this.accountId)
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
    try {
      const supabase = await createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('account_id', this.accountId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}
