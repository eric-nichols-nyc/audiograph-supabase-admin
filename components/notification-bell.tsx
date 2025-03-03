'use client';

import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const {
    data: notifications,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Calculate unread count
  useEffect(() => {
    if (notifications) {
      setUnreadCount(notifications.filter(n => !n.read).length);
    }
  }, [notifications]);

  // Mark notification as read
  const markAsRead = async (id: string) => {
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    refetch();
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).eq('read', false);
    refetch();
  };

  // Add this to your NotificationBell component
  useEffect(() => {
    const supabase = createClient();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        payload => {
          // Play a sound
          const audio = new Audio('/sounds/notification.mp3');
          audio.play();

          // Show browser notification if supported
          if (Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
            });
          }

          // Refetch notifications
          refetch();
        }
      )
      .subscribe();

    // Request notification permission
    if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    return () => {
      subscription.unsubscribe();
    };
  }, [refetch]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : notifications?.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No notifications</div>
          ) : (
            notifications?.map(notification => (
              <div
                key={notification.id}
                className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'success'
                        ? 'bg-green-500'
                        : notification.type === 'error'
                          ? 'bg-red-500'
                          : notification.type === 'warning'
                            ? 'bg-amber-500'
                            : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <h4 className="font-medium">{notification.title}</h4>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
