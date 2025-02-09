import { create } from "zustand";

interface NotificationsStore {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
}


export const useNotificationsStore = create<NotificationsStore>((set) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
}));


