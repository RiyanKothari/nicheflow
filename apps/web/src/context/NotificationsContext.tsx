import { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface AppNotification {
  id: string;
  type: "booking" | "invoice" | "stock" | "task" | "review";
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextType>({
  notifications: [], unreadCount: 0, markRead: () => {}, markAllRead: () => {}, refresh: () => {},
});

export function useNotifications() { return useContext(NotificationsContext); }

function getReadIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem("nf_notif_read") || "[]")); }
  catch { return new Set(); }
}

function saveReadIds(ids: Set<string>) {
  localStorage.setItem("nf_notif_read", JSON.stringify([...ids]));
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [raw, setRaw] = useState<Omit<AppNotification, "read">[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(getReadIds());

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("nf_token");
    if (!token) return;
    const res = await fetch("/api/notifications", { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setRaw(d.notifications || []); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const notifications: AppNotification[] = raw.map(n => ({ ...n, read: readIds.has(n.id) }));
  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id: string) => setReadIds(prev => { const next = new Set(prev).add(id); saveReadIds(next); return next; });
  const markAllRead = () => setReadIds(prev => { const next = new Set([...prev, ...raw.map(n => n.id)]); saveReadIds(next); return next; });

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, markRead, markAllRead, refresh }}>
      {children}
    </NotificationsContext.Provider>
  );
}
