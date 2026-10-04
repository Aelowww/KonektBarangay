"use client";

import { useCallback, useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import styles from "./notifications.module.css";
import { useAuth } from "../components/AuthProvider";
import {
  IconAlert,
  IconBell,
  IconCheck,
  IconCheckCircle,
  IconXCircle,
  SpotNotification,
} from "../components/icons";

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

function formatNotificationDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} min ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day(s) ago`;

  return date.toLocaleDateString();
}

function toneFor(item: NotificationRow) {
  const text = `${item.title} ${item.message}`.toLowerCase();
  if (/(approved|completed|ready|released)/.test(text)) return { icon: IconCheckCircle, cls: "tone_success" };
  if (/(rejected|declined|denied|dismissed|unsuccessful)/.test(text)) return { icon: IconXCircle, cls: "tone_danger" };
  if (/(cancel)/.test(text)) return { icon: IconAlert, cls: "tone_warning" };
  return { icon: IconBell, cls: "tone_info" };
}

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<"all" | "unread">("all");
  const { refreshUnread } = useAuth();

  const loadNotifications = useCallback(async (currentUserId: string) => {
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, created_at, is_read")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setNotifications([]);
      return;
    }

    setNotifications((data ?? []) as NotificationRow[]);
  }, []);

  const syncNotificationsState = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Please log in to view notifications.");
      setUserId(null);
      setNotifications([]);
      setLoading(false);
      setInitialized(true);
      return;
    }

    setLoading(true);
    setUserId(user.id);
    setError(null);
    await loadNotifications(user.id);
    setLoading(false);
    setInitialized(true);
  }, [loadNotifications]);

  useEffect(() => {
    queueMicrotask(() => {
      void syncNotificationsState();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncNotificationsState();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [syncNotificationsState]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-page-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void loadNotifications(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadNotifications, userId]);

  useEffect(() => {
    if (!userId) return;

    const syncNotifications = () => {
      if (document.visibilityState !== "visible") return;
      void loadNotifications(userId);
    };

    window.addEventListener("focus", syncNotifications);
    document.addEventListener("visibilitychange", syncNotifications);

    return () => {
      window.removeEventListener("focus", syncNotifications);
      document.removeEventListener("visibilitychange", syncNotifications);
    };
  }, [loadNotifications, userId]);

  const handleMarkAsRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, is_read: true } : notification
      )
    );
    refreshUnread();
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);

    if (error) {
      setError(error.message);
      return;
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    refreshUnread();
  };

  if (!initialized || loading) {
    return (
      <main className="kb-loader" role="status" aria-live="polite">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
          <h2>Loading notifications</h2>
          <p>Fetching your latest alerts and updates...</p>
        </div>
      </main>
    );
  }

  const unread = notifications.filter((n) => !n.is_read).length;
  const visible = tab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  return (
    <main className="kb-page kb-page-narrow">
      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Inbox</p>
          <h1 className="kb-title">Notifications</h1>
          <p className="kb-subtitle">Latest service updates and reminders from KonektBarangay.</p>
        </div>
        {unread > 0 && (
          <button type="button" className="kb-btn kb-btn-soft kb-btn-sm" onClick={handleMarkAllAsRead}>
            <IconCheck size={16} /> Mark all as read
          </button>
        )}
      </header>

      {error ? (
        <div className="kb-alert" style={{ marginBottom: 16 }}>
          <IconAlert size={18} /> {error}
        </div>
      ) : null}

      <section className="kb-card">
        <div className={styles.toolbar}>
          <div className="kb-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={tab === "all"}
              className={`kb-tab ${tab === "all" ? "is-active" : ""}`}
              onClick={() => setTab("all")}
            >
              All <span className="kb-tab-count">{notifications.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={tab === "unread"}
              className={`kb-tab ${tab === "unread" ? "is-active" : ""}`}
              onClick={() => setTab("unread")}
            >
              Unread <span className="kb-tab-count">{unread}</span>
            </button>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="kb-empty">
            <SpotNotification size={84} />
            <h3>{tab === "unread" ? "You're all caught up" : "No notifications yet"}</h3>
            <p>Updates about your requests and appointments will show up here.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {visible.map((item) => {
              const tone = toneFor(item);
              const Icon = tone.icon;
              return (
                <li key={item.id} className={`${styles.item} ${item.is_read ? styles.read : ""}`}>
                  <span className={`${styles.itemIcon} ${styles[tone.cls]}`}>
                    <Icon size={20} />
                  </span>
                  <div className={styles.itemBody}>
                    <div className={styles.itemTop}>
                      <h2>{item.title}</h2>
                      <time>{formatNotificationDate(item.created_at)}</time>
                    </div>
                    <p>{item.message}</p>
                    {!item.is_read ? (
                      <button type="button" className={styles.markReadBtn} onClick={() => handleMarkAsRead(item.id)}>
                        Mark as read
                      </button>
                    ) : null}
                  </div>
                  {!item.is_read && <span className={styles.unreadDot} aria-label="Unread" />}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
