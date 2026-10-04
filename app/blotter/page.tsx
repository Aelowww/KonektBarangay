"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import supabase from "../../lib/supabaseClient";
import { formatDate } from "../../lib/documents";
import {
  BLOTTER_STATUSES,
  INCIDENT_TYPES,
  blotterStatusClass,
  blotterStatusLabel,
  formatDateTime,
  type BlotterReport,
} from "../../lib/community";
import { useAuth } from "../components/AuthProvider";
import { useResidentOnly } from "../components/useResidentOnly";
import VerificationBanner from "../components/VerificationBanner";
import { IconAlert, IconCalendar, IconCheckCircle, IconMapPin, IconPlus, SpotBlotter } from "../components/icons";
import styles from "./blotter.module.css";

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayIso() {
  return isoDate(new Date());
}

function earliestIso() {
  const d = new Date();
  d.setDate(d.getDate() - 365);
  return isoDate(d);
}

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("kb_not_approved")) return "Verify your identity before filing a blotter report.";
  if (m.includes("kb_blotter_limit")) return "You already have 3 open reports. Please wait for them to be resolved.";
  if (m.includes("kb_daily_limit")) return "You've reached today's report limit. Please try again tomorrow.";
  if (m.includes("kb_bad_date")) return "Choose an incident date from the past 12 months (not a future date).";
  if (m.includes("check constraint") || m.includes("violates")) return "Please check the details and try again.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Network error. Check your connection and try again.";
  return "We couldn't file your report. Please try again.";
}

const EMPTY_FORM = {
  incident_type: "",
  incident_date: "",
  incident_time: "",
  location: "",
  respondent_name: "",
  narrative: "",
};

export default function BlotterPage() {
  const { user, verification } = useAuth();
  const blocked = useResidentOnly();
  const verified = verification === "approved";

  const [reports, setReports] = useState<BlotterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filedCase, setFiledCase] = useState<string | null>(null);

  const load = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("blotter_reports")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });
    setReports((data ?? []) as BlotterReport[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    queueMicrotask(() => void load(user.id));
  }, [user, load]);

  const set = (key: keyof typeof EMPTY_FORM, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setError("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !user) return;
    setError("");

    if (!form.incident_type) return setError("Choose what kind of incident happened.");
    if (!form.incident_date) return setError("Enter the date of the incident.");
    if (form.incident_date > todayIso()) return setError("The incident date can't be in the future.");
    if (form.incident_date < earliestIso()) {
      return setError("Online reports cover incidents from the past 12 months. For older incidents, visit the barangay hall.");
    }
    if (form.location.trim().length < 2) return setError("Enter where the incident happened.");
    if (form.narrative.trim().length < 20) return setError("Describe what happened (at least 20 characters).");
    if (!confirmed) return setError("Please confirm that your statement is true.");

    setSubmitting(true);
    const { data, error } = await supabase
      .from("blotter_reports")
      .insert({
        user_id: user.id,
        incident_type: form.incident_type,
        incident_date: form.incident_date,
        incident_time: form.incident_time.trim() || null,
        location: form.location.trim(),
        respondent_name: form.respondent_name.trim() || null,
        narrative: form.narrative.trim(),
      })
      .select("case_number")
      .single();
    setSubmitting(false);

    if (error) {
      setError(friendlyError(error.message));
      return;
    }

    setFiledCase(data?.case_number ?? "");
    setForm(EMPTY_FORM);
    setConfirmed(false);
    setShowForm(false);
    void load(user.id);
  };

  if (blocked) return null;

  return (
    <main className="kb-page kb-page-narrow">
      <VerificationBanner />

      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Barangay Services</p>
          <h1 className="kb-title">Blotter reports</h1>
          <p className="kb-subtitle">
            Report an incident to the barangay for record and mediation. For emergencies, call 911 or go to the
            barangay hall immediately.
          </p>
        </div>
        {verified && !showForm && (
          <button className="kb-btn kb-btn-primary" onClick={() => setShowForm(true)}>
            <IconPlus size={18} /> File a report
          </button>
        )}
      </header>

      {filedCase !== null && (
        <div className="kb-alert kb-alert-info" style={{ marginBottom: 16 }}>
          <IconCheckCircle size={18} />
          <span>
            Report {filedCase ? <strong>{filedCase}</strong> : ""} filed. You&apos;ll be notified when the barangay
            updates it.
          </span>
        </div>
      )}

      {!verified && verification && (
        <div className="kb-card kb-empty" style={{ marginBottom: 16 }}>
          <SpotBlotter size={80} />
          <h3>Verified residents only</h3>
          <p>To keep reports accountable, only residents with a verified ID can file a blotter report online.</p>
          <Link href="/verify-identity" className="kb-btn kb-btn-primary kb-btn-sm">
            Verify my identity
          </Link>
        </div>
      )}

      {showForm && (
        <form className={`kb-card ${styles.form}`} onSubmit={submit} noValidate>
          <h2>File a blotter report</h2>

          <div className={styles.grid2}>
            <div className="kb-field">
              <label className="kb-label" htmlFor="b-type">
                Type of incident
              </label>
              <select
                id="b-type"
                className="kb-select"
                value={form.incident_type}
                onChange={(e) => set("incident_type", e.target.value)}
              >
                <option value="">Select</option>
                {INCIDENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.grid2}>
              <div className="kb-field">
                <label className="kb-label" htmlFor="b-date">
                  Date
                </label>
                <input
                  id="b-date"
                  type="date"
                  min={earliestIso()}
                  max={todayIso()}
                  className="kb-input"
                  value={form.incident_date}
                  onChange={(e) => set("incident_date", e.target.value)}
                />
              </div>
              <div className="kb-field">
                <label className="kb-label" htmlFor="b-time">
                  Time <small>(approx.)</small>
                </label>
                <input
                  id="b-time"
                  type="time"
                  className="kb-input"
                  value={form.incident_time}
                  onChange={(e) => set("incident_time", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className={styles.grid2}>
            <div className="kb-field">
              <label className="kb-label" htmlFor="b-location">
                Where did it happen?
              </label>
              <input
                id="b-location"
                className="kb-input"
                maxLength={200}
                placeholder="Street, purok, or landmark"
                value={form.location}
                onChange={(e) => set("location", e.target.value)}
              />
            </div>
            <div className="kb-field">
              <label className="kb-label" htmlFor="b-respondent">
                Person involved <small>(optional)</small>
              </label>
              <input
                id="b-respondent"
                className="kb-input"
                maxLength={120}
                placeholder="Name of the other party, if known"
                value={form.respondent_name}
                onChange={(e) => set("respondent_name", e.target.value)}
              />
            </div>
          </div>

          <div className="kb-field">
            <label className="kb-label" htmlFor="b-narrative">
              What happened? <small>({form.narrative.trim().length}/3000)</small>
            </label>
            <textarea
              id="b-narrative"
              className="kb-textarea"
              rows={6}
              maxLength={3000}
              placeholder="Describe the incident in your own words: what happened, who was involved, and any witnesses."
              value={form.narrative}
              onChange={(e) => set("narrative", e.target.value)}
            />
          </div>

          <label className={styles.confirm}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => {
                setConfirmed(e.target.checked);
                setError("");
              }}
            />
            <span>
              I certify that this statement is true to the best of my knowledge. I understand that filing a false
              report may have legal consequences.
            </span>
          </label>

          {error && (
            <div className="kb-alert">
              <IconAlert size={18} /> {error}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className="kb-btn kb-btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="kb-btn kb-btn-primary" disabled={submitting}>
              {submitting ? "Filing..." : "Submit report"}
            </button>
          </div>
        </form>
      )}

      <section className="kb-card">
        <div className="kb-card-head">
          <h2>My reports</h2>
        </div>
        {loading ? (
          <div style={{ padding: 20, display: "grid", gap: 10 }}>
            {[0, 1].map((i) => (
              <span key={i} className="kb-skeleton" style={{ height: 70, display: "block" }} />
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="kb-empty">
            <SpotBlotter size={72} />
            <h3>No reports filed</h3>
            <p>Reports you file will appear here with their status.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {reports.map((r) => (
              <li key={r.id} className={styles.item}>
                <div className={styles.itemTop}>
                  <div>
                    <strong>{r.incident_type}</strong>
                    <span className="kb-mono">{r.case_number}</span>
                  </div>
                  <span className={`kb-status ${blotterStatusClass(r.status)}`}>{blotterStatusLabel(r.status)}</span>
                </div>
                <div className={styles.itemMeta}>
                  <span>
                    <IconCalendar size={14} /> {formatDate(r.incident_date)}
                    {r.incident_time ? ` · ${r.incident_time}` : ""}
                  </span>
                  <span>
                    <IconMapPin size={14} /> {r.location}
                  </span>
                </div>
                <p className={styles.hint}>{BLOTTER_STATUSES.find((s) => s.value === r.status)?.hint}</p>
                {r.status === "scheduled" && r.hearing_at && (
                  <p className={styles.hearing}>
                    <IconCalendar size={15} /> Hearing: <strong>{formatDateTime(r.hearing_at)}</strong> at the
                    barangay hall
                  </p>
                )}
                {r.admin_remarks && (
                  <p className={styles.remarks}>
                    <span>Barangay remarks:</span> {r.admin_remarks}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
