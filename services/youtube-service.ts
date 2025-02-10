import 'server-only';
import { SupabaseClient } from '@supabase/supabase-js';


export function createNotificationsService(client: SupabaseClient) {
  return new NotificationsService(client);
}

class NotificationsService {
  constructor(private readonly client: SupabaseClient) {}

  async createNotification() {
    // const { error } = await this.client.from('notifications').insert(params);

    // if (error) {
    //   throw error;
    // }
  }
}
