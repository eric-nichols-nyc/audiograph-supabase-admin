"use client";

import { timeAgo } from "@/utils/time-ago";
import { Separator } from "@/components/ui/separator";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { Notification } from "@/hooks/useFetchNotification";

interface NotificationItemProps {
  notification: Notification;
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/notifications?id=${notification.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Failed to delete notification");
      }
    } catch (error) {
      console.error("Error deleting notification", error);
    }
    setDeleting(false);
  };

  return (
    <>
      <li className="flex items-center justify-between py-2 mr-2">
        <div>
          <strong>{notification.title}</strong>
          <p className="text-sm">{notification.message}</p>
          <p className="text-xs text-gray-500">{timeAgo(notification.created_at)}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-2 text-red-500 hover:text-red-700"
          title="Delete Notification"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </li>
      <Separator />
    </>
  );
} 