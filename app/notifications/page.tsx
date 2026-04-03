"use client";

import { useCallback, useEffect, useState } from "react";
import supabase from "@/lib/supabaseClient";
import styles from "./notifications.module.css";

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

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

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
  };

  if (!initialized || loading) {
    return (
      <main className={styles.loadingScreen} role="status" aria-live="polite">
        <div className={styles.loadingCard}>
          <div className={styles.loadingOrb} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2 className={styles.loadingTitle}>Loading notifications</h2>
          <p className={styles.loadingSub}>Fetching your latest alerts and updates...</p>
          <div className={styles.loadingBars} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Notifications</h1>
        <p>Latest service updates and reminders from KonektBarangay.</p>
      </header>

      {error ? <div className={styles.card}>⚠ {error}</div> : null}

      <section className={styles.list}>
        {notifications.length === 0 ? (
          <p>No notifications yet.</p>
        ) : (
          notifications.map((item) => (
            <article
              key={item.id}
              className={styles.card}
              style={{ opacity: item.is_read ? 0.8 : 1 }}
            >
              <div className={styles.cardTop}>
                <h2>{item.title}</h2>
                <span>{formatNotificationDate(item.created_at)}</span>
              </div>
              <p>{item.message}</p>

              {!item.is_read ? (
                <button
                  type="button"
                  className={styles.markReadBtn}
                  onClick={() => handleMarkAsRead(item.id)}
                >
                  Mark as read
                </button>
              ) : null}
            </article>
          ))
        )}
      </section>

      <div className={styles.mobileMenuSpacer} aria-hidden="true" />
    </main>
  );
}
