'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import useFetchNotification from '@/hooks/useFetchNotification';
import { BellIcon } from 'lucide-react';
import NotificationItem from '@/components/features/notifications/notification-item';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Notification {
  id: string;
  account_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPopover() {
  const { notifications, loading } = useFetchNotification();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger>
        <div className="relative">
          <BellIcon className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent>
        {loading ? (
          <div>Loading...</div>
        ) : notifications.length > 0 ? (
          <ScrollArea className="h-[300px] w-full">
            <ul className="w-full">
              {notifications.map(notification => (
                <NotificationItem key={notification.id} notification={notification} />
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <div>No notifications</div>
        )}
      </PopoverContent>
    </Popover>
  );
}
