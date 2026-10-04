"use client";

import { useState } from "react";
import { formatDate } from "../../lib/documents";
import { categoryLabel, type Announcement } from "../../lib/community";
import { IconCalendar, IconClock, IconMapPin } from "./icons";
import styles from "./news.module.css";

export default function NewsCard({ item, compact = false }: { item: Announcement; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const long = item.body.length > (compact ? 140 : 320);

  return (
    <article className={`${styles.card} ${compact ? styles.compact : ""}`}>
      <div className={styles.meta}>
        <span className={`${styles.cat} ${styles[`cat_${item.category}`]}`}>{categoryLabel(item.category)}</span>
        <span className={styles.date}>{formatDate(item.created_at)}</span>
      </div>
      <h3>{item.title}</h3>

      {item.category === "event" && (item.event_date || item.location) && (
        <ul className={styles.eventInfo}>
          {item.event_date && (
            <li>
              <IconCalendar size={14} /> {formatDate(item.event_date, { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
            </li>
          )}
          {item.event_time && (
            <li>
              <IconClock size={14} /> {item.event_time}
            </li>
          )}
          {item.location && (
            <li>
              <IconMapPin size={14} /> {item.location}
            </li>
          )}
        </ul>
      )}

      <p className={`${styles.body} ${!expanded && long ? (compact ? styles.clamp2 : styles.clamp4) : ""}`}>
        {item.body}
      </p>
      {long && !compact && (
        <button type="button" className={styles.more} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </article>
  );
}
