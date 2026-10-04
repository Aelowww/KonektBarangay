"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import supabase from "@/lib/supabaseClient";
import { formatDate } from "@/lib/documents";
import { ANNOUNCEMENT_CATEGORIES, categoryLabel, type Announcement } from "@/lib/community";
import { IconAlert, IconClose, IconEdit, IconPlus, IconTrash, SpotNews } from "@/app/components/icons";
import styles from "./news-admin.module.css";

type Draft = {
  id?: string;
  title: string;
  body: string;
  category: Announcement["category"];
  event_date: string;
  event_time: string;
  location: string;
  is_published: boolean;
};

const EMPTY: Draft = {
  title: "",
  body: "",
  category: "news",
  event_date: "",
  event_time: "",
  location: "",
  is_published: true,
};

export default function AdminNewsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("announcements")
      .select("id, title, body, category, event_date, event_time, location, is_published, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    setItems((data ?? []) as Announcement[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft || saving) return;
    setFormError("");

    const title = draft.title.trim();
    const body = draft.body.trim();
    if (title.length < 3) return setFormError("Add a title (at least 3 characters).");
    if (!body) return setFormError("Write the announcement details.");
    if (draft.category === "event" && !draft.event_date) return setFormError("Events need a date.");

    const row = {
      title,
      body,
      category: draft.category,
      event_date: draft.category === "event" ? draft.event_date || null : null,
      event_time: draft.category === "event" ? draft.event_time.trim() || null : null,
      location: draft.category === "event" ? draft.location.trim() || null : null,
      is_published: draft.is_published,
    };

    setSaving(true);
    const { error } = draft.id
      ? await supabase.from("announcements").update(row).eq("id", draft.id)
      : await supabase.from("announcements").insert(row);
    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }
    setDraft(null);
    void load();
  };

  const togglePublish = async (item: Announcement) => {
    const { error } = await supabase
      .from("announcements")
      .update({ is_published: !item.is_published })
      .eq("id", item.id);
    if (error) setError(error.message);
    else setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_published: !i.is_published } : i)));
  };

  const remove = async () => {
    if (!deleting) return;
    const { error } = await supabase.from("announcements").delete().eq("id", deleting.id);
    if (error) setError(error.message);
    else setItems((prev) => prev.filter((i) => i.id !== deleting.id));
    setDeleting(null);
  };

  return (
    <div className="kb-page">
      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Administration</p>
          <h1 className="kb-title">News &amp; Events</h1>
          <p className="kb-subtitle">Post announcements, upcoming events, and advisories for residents.</p>
        </div>
        <button className="kb-btn kb-btn-primary" onClick={() => setDraft({ ...EMPTY })}>
          <IconPlus size={18} /> New post
        </button>
      </header>

      {error && (
        <div className="kb-alert" style={{ marginBottom: 16 }}>
          <IconAlert size={18} /> {error}
        </div>
      )}

      <section className="kb-card">
        {loading ? (
          <div style={{ padding: 20, display: "grid", gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="kb-skeleton" style={{ height: 56, display: "block" }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="kb-empty">
            <SpotNews size={84} />
            <h3>No posts yet</h3>
            <p>Share barangay news, upcoming events, or advisories with residents.</p>
            <button className="kb-btn kb-btn-primary kb-btn-sm" onClick={() => setDraft({ ...EMPTY })}>
              Create the first post
            </button>
          </div>
        ) : (
          <ul className={styles.list}>
            {items.map((item) => (
              <li key={item.id} className={styles.row}>
                <div className={styles.info}>
                  <div className={styles.metaRow}>
                    <span className={`${styles.cat} ${styles[`cat_${item.category}`]}`}>
                      {categoryLabel(item.category)}
                    </span>
                    {!item.is_published && <span className={styles.draft}>Hidden</span>}
                    <small>
                      Posted {formatDate(item.created_at)}
                      {item.category === "event" && item.event_date ? ` · Event on ${formatDate(item.event_date)}` : ""}
                    </small>
                  </div>
                  <strong>{item.title}</strong>
                  <p>{item.body}</p>
                </div>
                <div className={styles.actions}>
                  <label className={styles.toggle} title={item.is_published ? "Visible to residents" : "Hidden"}>
                    <input type="checkbox" checked={item.is_published} onChange={() => togglePublish(item)} />
                    <span>{item.is_published ? "Published" : "Hidden"}</span>
                  </label>
                  <button
                    className={styles.iconBtn}
                    aria-label="Edit"
                    title="Edit"
                    onClick={() =>
                      setDraft({
                        id: item.id,
                        title: item.title,
                        body: item.body,
                        category: item.category,
                        event_date: item.event_date ?? "",
                        event_time: item.event_time ?? "",
                        location: item.location ?? "",
                        is_published: item.is_published,
                      })
                    }
                  >
                    <IconEdit size={17} />
                  </button>
                  <button
                    className={`${styles.iconBtn} ${styles.danger}`}
                    aria-label="Delete"
                    title="Delete"
                    onClick={() => setDeleting(item)}
                  >
                    <IconTrash size={17} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {draft &&
        createPortal(
          <div className="kb-modal-overlay">
            <form className={`kb-modal ${styles.formModal}`} onSubmit={save} noValidate>
              <button type="button" className="kb-modal-close" onClick={() => setDraft(null)} aria-label="Close">
                <IconClose size={18} />
              </button>
              <h3>{draft.id ? "Edit post" : "New post"}</h3>

              <div className="kb-field">
                <span className="kb-label">Type</span>
                <div className="kb-tabs">
                  {ANNOUNCEMENT_CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      className={`kb-tab ${draft.category === c.value ? "is-active" : ""}`}
                      onClick={() => setDraft({ ...draft, category: c.value })}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="kb-field">
                <label className="kb-label" htmlFor="news-title">
                  Title
                </label>
                <input
                  id="news-title"
                  className="kb-input"
                  maxLength={150}
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Free anti-rabies vaccination this Saturday"
                />
              </div>

              {draft.category === "event" && (
                <div className={styles.grid3}>
                  <div className="kb-field">
                    <label className="kb-label" htmlFor="news-date">
                      Date
                    </label>
                    <input
                      id="news-date"
                      type="date"
                      className="kb-input"
                      value={draft.event_date}
                      onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
                    />
                  </div>
                  <div className="kb-field">
                    <label className="kb-label" htmlFor="news-time">
                      Time <small>(optional)</small>
                    </label>
                    <input
                      id="news-time"
                      className="kb-input"
                      maxLength={40}
                      placeholder="8:00 AM – 12:00 NN"
                      value={draft.event_time}
                      onChange={(e) => setDraft({ ...draft, event_time: e.target.value })}
                    />
                  </div>
                  <div className="kb-field">
                    <label className="kb-label" htmlFor="news-location">
                      Venue <small>(optional)</small>
                    </label>
                    <input
                      id="news-location"
                      className="kb-input"
                      maxLength={200}
                      placeholder="Barangay covered court"
                      value={draft.location}
                      onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="kb-field">
                <label className="kb-label" htmlFor="news-body">
                  Details
                </label>
                <textarea
                  id="news-body"
                  className="kb-textarea"
                  rows={6}
                  maxLength={5000}
                  value={draft.body}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                  placeholder="What residents need to know"
                />
              </div>

              <label className={styles.publishRow}>
                <input
                  type="checkbox"
                  checked={draft.is_published}
                  onChange={(e) => setDraft({ ...draft, is_published: e.target.checked })}
                />
                <span>Publish now (visible to everyone)</span>
              </label>

              {formError && (
                <div className="kb-alert">
                  <IconAlert size={18} /> {formError}
                </div>
              )}

              <div className="kb-modal-actions">
                <button type="button" className="kb-btn kb-btn-secondary" onClick={() => setDraft(null)}>
                  Cancel
                </button>
                <button type="submit" className="kb-btn kb-btn-primary" disabled={saving}>
                  {saving ? "Saving..." : draft.id ? "Save changes" : "Post"}
                </button>
              </div>
            </form>
          </div>,
          document.body
        )}

      {deleting &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-danger">
                <IconTrash size={28} />
              </div>
              <h3>Delete this post?</h3>
              <p>&ldquo;{deleting.title}&rdquo; will be removed for everyone. This can&apos;t be undone.</p>
              <div className="kb-modal-actions">
                <button className="kb-btn kb-btn-secondary" onClick={() => setDeleting(null)}>
                  Cancel
                </button>
                <button className="kb-btn kb-btn-danger" onClick={remove}>
                  Delete
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
