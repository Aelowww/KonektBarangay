"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import { formatDate } from "@/lib/documents";
import { useAuth } from "@/app/components/AuthProvider";
import {
  IconAlert,
  IconBadge,
  IconCheck,
  IconCheckCircle,
  IconClock,
  IconClose,
  IconEye,
  IconRefresh,
  IconSearch,
  IconUsers,
  IconXCircle,
  SpotResident,
} from "@/app/components/icons";
import styles from "./residents.module.css";

type Resident = {
  id: string;
  email: string;
  full_name: string;
  username: string;
  created_at: string;
  email_confirmed: boolean;
  verification_status: "pending" | "approved" | "rejected";
  verified_at: string | null;
  id_type: string | null;
  id_document_path: string | null;
  id_submitted_at: string | null;
  verification_note: string | null;
};

const TABS = ["to review", "no ID yet", "approved", "rejected", "all"] as const;
type Tab = (typeof TABS)[number];

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function inTab(r: Resident, tab: Tab) {
  switch (tab) {
    case "to review":
      return r.verification_status === "pending" && !!r.id_document_path;
    case "no ID yet":
      return r.verification_status === "pending" && !r.id_document_path;
    case "approved":
      return r.verification_status === "approved";
    case "rejected":
      return r.verification_status === "rejected";
    default:
      return true;
  }
}

function displayName(r: Resident) {
  return r.full_name || r.username || r.email.split("@")[0];
}

export default function ResidentsPage() {
  const router = useRouter();
  const { role, resolved } = useAuth();

  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("to review");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState(false);

  const [reviewing, setReviewing] = useState<Resident | null>(null);
  const [idUrl, setIdUrl] = useState<string | null>(null);
  const [idError, setIdError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [confirmRevoke, setConfirmRevoke] = useState<Resident | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error } = await supabase.rpc("kb_list_residents");
    if (error) {
      setError(error.message.includes("KB_FORBIDDEN") ? "Admins only." : error.message);
      setResidents([]);
    } else {
      setResidents((data ?? []) as Resident[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!resolved || role === null) return;
    if (role !== "admin") {
      router.replace("/");
      return;
    }
    queueMicrotask(() => void load());
  }, [resolved, role, router, load]);

  const counts = useMemo(() => {
    const c = {} as Record<Tab, number>;
    TABS.forEach((t) => (c[t] = residents.filter((r) => inTab(r, t)).length));
    return c;
  }, [residents]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return residents.filter(
      (r) =>
        inTab(r, tab) &&
        (!q ||
          r.full_name.toLowerCase().includes(q) ||
          r.username.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q))
    );
  }, [residents, tab, search]);

  const openReview = async (r: Resident) => {
    setReviewing(r);
    setNote("");
    setIdUrl(null);
    setIdError(null);
    if (!r.id_document_path) return;
    const { data, error } = await supabase.storage.from("resident-ids").createSignedUrl(r.id_document_path, 300);
    if (error || !data?.signedUrl) setIdError("Couldn't load the ID photo. Try refreshing.");
    else setIdUrl(data.signedUrl);
  };

  const setStatus = async (resident: Resident, status: Resident["verification_status"], reason?: string) => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc("kb_set_resident_status", {
      p_user: resident.id,
      p_status: status,
      p_note: reason?.trim() || null,
    });
    setBusy(false);

    if (error) {
      setError(error.message);
      return false;
    }

    setResidents((prev) =>
      prev.map((r) =>
        r.id === resident.id
          ? {
              ...r,
              verification_status: status,
              verified_at: status === "pending" ? null : new Date().toISOString(),
              verification_note: status === "rejected" ? reason?.trim() || null : null,
            }
          : r
      )
    );
    return true;
  };

  if (loading) {
    return (
      <div className="kb-loader" role="status" aria-live="polite">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
          <h2>Loading residents</h2>
          <p>Fetching registered accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="kb-page">
      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Administration</p>
          <h1 className="kb-title">Resident verification</h1>
          <p className="kb-subtitle">
            Check that the name on each uploaded ID matches the registered name before approving. Only verified
            residents can request documents.
          </p>
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

      <section className={styles.kpis}>
        <article className={`${styles.kpi} ${styles.tone_gold}`}>
          <span className={styles.kpiIcon}>
            <IconClock size={20} />
          </span>
          <div>
            <p>IDs to review</p>
            <strong>{counts["to review"]}</strong>
          </div>
        </article>
        <article className={`${styles.kpi} ${styles.tone_success}`}>
          <span className={styles.kpiIcon}>
            <IconCheckCircle size={20} />
          </span>
          <div>
            <p>Verified residents</p>
            <strong>{counts.approved}</strong>
          </div>
        </article>
        <article className={`${styles.kpi} ${styles.tone_brand}`}>
          <span className={styles.kpiIcon}>
            <IconUsers size={20} />
          </span>
          <div>
            <p>Total accounts</p>
            <strong>{counts.all}</strong>
          </div>
        </article>
      </section>

      <section className="kb-card">
        <div className={styles.toolbar}>
          <div className="kb-tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`kb-tab ${tab === t ? "is-active" : ""}`}
                onClick={() => setTab(t)}
              >
                {t}
                <span className="kb-tab-count">{counts[t]}</span>
              </button>
            ))}
          </div>
          <div className={`kb-input-wrap ${styles.search}`}>
            <IconSearch size={18} />
            <input
              className="kb-input"
              placeholder="Search name, username, or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search residents"
            />
          </div>
        </div>

        {error && (
          <div className="kb-alert" style={{ margin: "0 20px 16px" }}>
            <IconAlert size={18} /> {error}
          </div>
        )}

        {visible.length === 0 ? (
          <div className="kb-empty">
            <SpotResident size={84} />
            <h3>{tab === "to review" ? "No IDs waiting for review" : "No residents found"}</h3>
            <p>
              {tab === "to review"
                ? "When a resident uploads their ID, it will appear here."
                : "Try another tab or search."}
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {visible.map((r) => {
              const name = displayName(r);
              return (
                <li key={r.id} className={styles.row}>
                  <span className={styles.avatar}>{initials(name)}</span>
                  <div className={styles.info}>
                    <strong>{name}</strong>
                    <span>
                      {r.username ? `@${r.username} · ` : ""}
                      {r.email}
                    </span>
                    <small>
                      {r.id_submitted_at
                        ? `${r.id_type ?? "ID"} uploaded ${formatDate(r.id_submitted_at)}`
                        : `Registered ${formatDate(r.created_at)} · No ID uploaded`}
                    </small>
                  </div>

                  <span className={`kb-status ${styles[`st_${r.verification_status}`]}`}>
                    {r.verification_status === "approved"
                      ? "verified"
                      : r.verification_status === "pending"
                        ? r.id_document_path
                          ? "to review"
                          : "no ID"
                        : "rejected"}
                  </span>

                  <div className={styles.actions}>
                    {r.verification_status === "approved" ? (
                      <>
                        {r.id_document_path && (
                          <button className="kb-btn kb-btn-secondary kb-btn-sm" onClick={() => openReview(r)}>
                            <IconEye size={15} /> View ID
                          </button>
                        )}
                        <button
                          className="kb-btn kb-btn-danger-soft kb-btn-sm"
                          disabled={busy}
                          onClick={() => setConfirmRevoke(r)}
                        >
                          <IconClose size={14} /> Revoke
                        </button>
                      </>
                    ) : (
                      <button
                        className={`kb-btn kb-btn-sm ${r.id_document_path ? "kb-btn-primary" : "kb-btn-secondary"}`}
                        onClick={() => openReview(r)}
                      >
                        <IconBadge size={15} /> {r.id_document_path ? "Review ID" : "Details"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {reviewing &&
        createPortal(
          <div className="kb-modal-overlay" onClick={() => !busy && setReviewing(null)}>
            <div className={`kb-modal ${styles.reviewModal}`} onClick={(e) => e.stopPropagation()}>
              <button className="kb-modal-close" onClick={() => setReviewing(null)} aria-label="Close">
                <IconClose size={18} />
              </button>

              <h3>Verify resident</h3>

              <div className={styles.reviewGrid}>
                <div className={styles.idFrame}>
                  {!reviewing.id_document_path ? (
                    <p>No ID uploaded yet. The resident is asked to upload one when they sign in.</p>
                  ) : idUrl ? (
                    <a href={idUrl} target="_blank" rel="noreferrer" title="Open full size">
                      <img src={idUrl} alt={`ID uploaded by ${displayName(reviewing)}`} />
                    </a>
                  ) : idError ? (
                    <p>{idError}</p>
                  ) : (
                    <div className="kb-spinner" />
                  )}
                </div>

                <dl className={styles.details}>
                  <div>
                    <dt>Registered name</dt>
                    <dd className={styles.bigName}>{reviewing.full_name || "— (not provided)"}</dd>
                  </div>
                  {reviewing.username && (
                    <div>
                      <dt>Username</dt>
                      <dd>@{reviewing.username}</dd>
                    </div>
                  )}
                  <div>
                    <dt>Email</dt>
                    <dd>
                      {reviewing.email} {reviewing.email_confirmed ? "(verified)" : "(not verified)"}
                    </dd>
                  </div>
                  <div>
                    <dt>ID type</dt>
                    <dd>{reviewing.id_type ?? "—"}</dd>
                  </div>
                  <div>
                    <dt>Uploaded</dt>
                    <dd>{reviewing.id_submitted_at ? formatDate(reviewing.id_submitted_at) : "—"}</dd>
                  </div>
                </dl>
              </div>

              {reviewing.verification_status !== "approved" && (
                <>
                  <p className={styles.checkHint}>
                    Approve only if the name and photo on the ID clearly match this resident.
                  </p>
                  <textarea
                    className="kb-textarea"
                    rows={2}
                    maxLength={300}
                    placeholder="Reason if rejecting (shown to the resident), e.g. Photo is blurry, name doesn't match"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <div className="kb-modal-actions">
                    <button
                      className="kb-btn kb-btn-danger-soft"
                      disabled={busy || reviewing.verification_status === "rejected"}
                      onClick={async () => {
                        if (await setStatus(reviewing, "rejected", note)) setReviewing(null);
                      }}
                    >
                      <IconXCircle size={16} /> Reject
                    </button>
                    <button
                      className="kb-btn kb-btn-success"
                      disabled={busy || !reviewing.email_confirmed}
                      title={reviewing.email_confirmed ? undefined : "The resident hasn't verified their email yet"}
                      onClick={async () => {
                        if (await setStatus(reviewing, "approved")) setReviewing(null);
                      }}
                    >
                      <IconCheck size={16} /> Approve
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

      {confirmRevoke &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-danger">
                <IconXCircle size={30} />
              </div>
              <h3>Revoke verification?</h3>
              <p>
                {displayName(confirmRevoke)} won&apos;t be able to request documents until they upload a valid ID and
                are approved again.
              </p>
              <div className="kb-modal-actions">
                <button className="kb-btn kb-btn-secondary" onClick={() => setConfirmRevoke(null)}>
                  Cancel
                </button>
                <button
                  className="kb-btn kb-btn-danger"
                  onClick={() => {
                    const r = confirmRevoke;
                    setConfirmRevoke(null);
                    void setStatus(r, "rejected", "Verification revoked by the barangay");
                  }}
                >
                  Revoke
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
