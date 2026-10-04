"use client";

import { useEffect, useMemo, useState } from "react";
import supabase from "../../lib/supabaseClient";
import { ANNOUNCEMENT_CATEGORIES, type Announcement } from "../../lib/community";
import NewsCard from "../components/NewsCard";
import { SpotNews } from "../components/icons";
import styles from "../components/news.module.css";

type Filter = "all" | Announcement["category"];

const TAB_LABELS: Record<Filter, string> = { all: "All", news: "News", event: "Events", advisory: "Advisories" };

export default function NewsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    let active = true;
    void supabase
      .from("announcements")
      .select("id, title, body, category, event_date, event_time, location, is_published, created_at")
      .eq("is_published", true)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        if (!active) return;
        setItems((data ?? []) as Announcement[]);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length };
    items.forEach((i) => (c[i.category] = (c[i.category] ?? 0) + 1));
    return c;
  }, [items]);

  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <main className="kb-page kb-page-narrow">
      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Barangay Updates</p>
          <h1 className="kb-title">News &amp; Events</h1>
          <p className="kb-subtitle">Announcements, upcoming activities, and advisories from the barangay.</p>
        </div>
      </header>

      <div className="kb-tabs" role="tablist" style={{ width: "fit-content", maxWidth: "100%", marginBottom: 16 }}>
        {(["all", ...ANNOUNCEMENT_CATEGORIES.map((c) => c.value)] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`kb-tab ${filter === f ? "is-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {TAB_LABELS[f]}
            <span className="kb-tab-count">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.list}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="kb-skeleton" style={{ height: 120, display: "block" }} />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="kb-card kb-empty">
          <SpotNews size={84} />
          <h3>No posts yet</h3>
          <p>Barangay news, events, and advisories will appear here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {visible.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </main>
  );
}
