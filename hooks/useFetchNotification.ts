import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/utils/supabase/client";

export interface Notification {
  id: string;
  account_id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  // ... include other fields if needed
}

export default function useFetchNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabase();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) {
          throw new Error("Error fetching notifications");
        }
        const data: Notification[] = await res.json();
        setNotifications(data);
      } catch (error: any) {
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Set up realtime subscription to the notifications table
    const subscription = supabase.channel("notifications-channel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          console.log("Realtime payload:", payload);
          // Handle row insertions, updates and deletions
          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) =>
              prev.map((notification) =>
                notification.id === updatedNotification.id
                  ? updatedNotification
                  : notification
              )
            );
          } else if (payload.eventType === "DELETE") {
            const deletedNotification = payload.old as Notification;
            setNotifications((prev) =>
              prev.filter(
                (notification) => notification.id !== deletedNotification.id
              )
            );
          }
        }
      )
      .subscribe();

    // Clean up the subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [supabase]);

  return { notifications, loading };
}
