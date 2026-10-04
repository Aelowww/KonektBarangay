"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import supabase from "@/lib/supabaseClient";
import { formatDate } from "@/lib/documents";
import {
  BLOTTER_STATUSES,
  blotterStatusClass,
  blotterStatusLabel,
  formatDateTime,
  type BlotterReport,
  type BlotterStatus,
} from "@/lib/community";
import { IconAlert, IconClose, IconRefresh, IconSearch, SpotBlotter } from "@/app/components/icons";
import styles from "./blotter-admin.module.css";

type Tab = "open" | BlotterStatus | "all";
const OPEN: BlotterStatus[] = ["filed", "under_review", "scheduled"];

const TABS: { value: Tab; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "filed", label: "New" },
  { value: "under_review", label: "Under review" },
  { value: "scheduled", label: "Scheduled" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
];

function matches(r: BlotterReport, tab: Tab) {
  if (tab === "all") return true;
  if (tab === "open") return OPEN.includes(r.status);
  return r.status === tab;
}

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminBlotterPage() {
  const [reports, setReports] = useState<BlotterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("open");
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<BlotterReport | null>(null);
  const [status, setStatus] = useState<BlotterStatus>("filed");
  const [hearing, setHearing] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase.rpc("kb_list_blotters");
    if (error) setError(error.message);
    setReports((data ?? []) as BlotterReport[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    TABS.forEach((t) => (c[t.value] = reports.filter((r) => matches(r, t.value)).length));
    return c;
  }, [reports]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return reports.filter(
      (r) =>
        matches(r, tab) &&
        (!q ||
          (r.case_number ?? "").toLowerCase().includes(q) ||
          (r.reporter_name ?? "").toLowerCase().includes(q) ||
          (r.respondent_name ?? "").toLowerCase().includes(q) ||
          r.incident_type.toLowerCase().includes(q))
    );
  }, [reports, tab, search]);

  const open = (r: BlotterReport) => {
    setSelected(r);
    setStatus(r.status);
    setHearing(toLocalInput(r.hearing_at));
    setRemarks(r.admin_remarks ?? "");
    setFormError("");
  };

  const save = async () => {
    if (!selected || saving) return;
    setFormError("");
    if (status === "scheduled" && !hearing) {
      setFormError("Set the hearing date and time.");
      return;
    }

    const patch = {
      status,
      hearing_at: status === "scheduled" && hearing ? new Date(hearing).toISOString() : selected.hearing_at,
      admin_remarks: remarks.trim() || null,
    };

    setSaving(true);
    const { error } = await supabase.from("blotter_reports").update(patch).eq("id", selected.id);
    setSaving(false);

    if (error) {
      setFormError(error.message);
      return;
    }

    setReports((prev) => prev.map((r) => (r.id === selected.id ? { ...r, ...patch } : r)));
    setSelected(null);
  };

  return (
    <div className="kb-page">
      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Administration</p>
          <h1 className="kb-title">Blotter reports</h1>
          <p className="kb-subtitle">Review incident reports filed by residents, schedule hearings, and record outcomes.</p>
        </div>
        <button
          className="kb-btn kb-btn-secondary"
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          <IconRefresh size={17} /> Refresh
        </button>
      </header>

      <section className="kb-card">
        <div className={styles.toolbar}>
          <div className="kb-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.value}
                role="tab"
                aria-selected={tab === t.value}
                className={`kb-tab ${tab === t.value ? "is-active" : ""}`}
                onClick={() => setTab(t.value)}
              >
                {t.label}
                <span className="kb-tab-count">{counts[t.value] ?? 0}</span>
              </button>
            ))}
          </div>
          <div className={`kb-input-wrap ${styles.search}`}>
            <IconSearch size={18} />
            <input
              className="kb-input"
              placeholder="Search case no., name, or type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search reports"
            />
          </div>
        </div>

        {error && (
          <div className="kb-alert" style={{ margin: "0 20px 16px" }}>
            <IconAlert size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div style={{ padding: 20, display: "grid", gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <span key={i} className="kb-skeleton" style={{ height: 60, display: "block" }} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="kb-empty">
            <SpotBlotter size={80} />
            <h3>No reports here</h3>
            <p>Blotter reports filed by verified residents will appear here.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {visible.map((r) => (
              <li key={r.id}>
                <button type="button" className={styles.row} onClick={() => open(r)}>
                  <div className={styles.main}>
                    <strong>{r.incident_type}</strong>
                    <span>
                      <span className="kb-mono">{r.case_number}</span> · Filed by {r.reporter_name ?? "—"}
                    </span>
                    <small>
                      Incident {formatDate(r.incident_date)} · {r.location}
                    </small>
                  </div>
                  <div className={styles.side}>
                    <span className={`kb-status ${blotterStatusClass(r.status)}`}>{blotterStatusLabel(r.status)}</span>
                    {r.status === "scheduled" && r.hearing_at && <small>Hearing {formatDateTime(r.hearing_at)}</small>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {selected &&
        createPortal(
          <div className="kb-modal-overlay" onClick={() => !saving && setSelected(null)}>
            <div className={`kb-modal ${styles.modal}`} onClick={(e) => e.stopPropagation()}>
              <button className="kb-modal-close" onClick={() => setSelected(null)} aria-label="Close">
                <IconClose size={18} />
              </button>
              <p className={styles.caseNo}>{selected.case_number}</p>
              <h3>{selected.incident_type}</h3>

              <dl className={styles.details}>
                <div>
                  <dt>Complainant</dt>
                  <dd>
                    {selected.reporter_name}
                    <small>{selected.reporter_email}</small>
                  </dd>
                </div>
                <div>
                  <dt>Person involved</dt>
                  <dd>{selected.respondent_name || "Not specified"}</dd>
                </div>
                <div>
                  <dt>Date &amp; time</dt>
                  <dd>
                    {formatDate(selected.incident_date)}
                    {selected.incident_time ? ` · ${selected.incident_time}` : ""}
                  </dd>
                </div>
                <div>
                  <dt>Location</dt>
                  <dd>{selected.location}</dd>
                </div>
                <div>
                  <dt>Filed</dt>
                  <dd>{formatDateTime(selected.created_at)}</dd>
                </div>
              </dl>

              <div className={styles.narrative}>
                <span>Statement</span>
                <p>{selected.narrative}</p>
              </div>

              <div className={styles.manage}>
                <div className="kb-field">
                  <label className="kb-label" htmlFor="bl-status">
                    Status
                  </label>
                  <select
                    id="bl-status"
                    className="kb-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BlotterStatus)}
                  >
                    {BLOTTER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                {status === "scheduled" && (
                  <div className="kb-field">
                    <label className="kb-label" htmlFor="bl-hearing">
                      Hearing date &amp; time
                    </label>
                    <input
                      id="bl-hearing"
                      type="datetime-local"
                      className="kb-input"
                      value={hearing}
                      onChange={(e) => setHearing(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="kb-field">
                <label className="kb-label" htmlFor="bl-remarks">
                  Remarks <small>(visible to the resident)</small>
                </label>
                <textarea
                  id="bl-remarks"
                  className="kb-textarea"
                  rows={3}
                  maxLength={1000}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Both parties invited for mediation; bring a valid ID."
                />
              </div>

              {formError && (
                <div className="kb-alert" style={{ marginTop: 12 }}>
                  <IconAlert size={18} /> {formError}
                </div>
              )}

              <div className="kb-modal-actions">
                <button className="kb-btn kb-btn-secondary" onClick={() => setSelected(null)}>
                  Close
                </button>
                <button className="kb-btn kb-btn-primary" onClick={save} disabled={saving}>
                  {saving ? "Saving..." : "Save & notify resident"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
