"use client";

import { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";
import type { Announcement } from "../../lib/community";
import NewsCard from "./NewsCard";
import styles from "./news.module.css";

export default function NewsPreview({
  limit = 3,
  layout = "grid",
  emptyText,
  upcomingEvents = false,
}: {
  limit?: number;
  layout?: "grid" | "list";
  emptyText?: string;
  upcomingEvents?: boolean;
}) {
  const [items, setItems] = useState<Announcement[] | null>(null);

  useEffect(() => {
    let active = true;
    let query = supabase
      .from("announcements")
      .select("id, title, body, category, event_date, event_time, location, is_published, created_at")
      .eq("is_published", true);
    if (upcomingEvents) {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      query = query.eq("category", "event").gte("event_date", today).order("event_date", { ascending: true });
    } else {
      query = query.order("created_at", { ascending: false });
    }
    void query
      .limit(limit)
      .then(({ data }) => {
        if (active) setItems((data ?? []) as Announcement[]);
      });
    return () => {
      active = false;
    };
  }, [limit, upcomingEvents]);

  if (!items) return null;
  if (items.length === 0) {
    return emptyText ? <p className={styles.empty}>{emptyText}</p> : null;
  }

  return (
    <div className={layout === "grid" ? styles.preview : styles.list}>
      {items.map((item) => (
        <NewsCard key={item.id} item={item} compact />
      ))}
    </div>
  );
}
