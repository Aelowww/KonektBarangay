"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient";
import { REQUEST_STATUSES, formatDate, normalizeStatus } from "../../../lib/documents";
import {
  BLOTTER_STATUSES,
  blotterStatusClass,
  blotterStatusLabel,
  formatDateTime,
  type BlotterReport,
} from "../../../lib/community";
import styles from "./manage-services.module.css";
import {
  DocumentSpot,
  IconAlert,
  IconCalendar,
  IconCheckCircle,
  IconClock,
  IconDocument,
  IconMapPin,
  IconPlus,
  IconScale,
  SpotBlotter,
  SpotTrack,
} from "../../components/icons";

type Kind = "documents" | "blotter";

type Request = {
  id: string;
  user_id: string;
  document_type: string;
  other_document: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
  created_at?: string | null;
};

const STATUS_HINT: Record<string, string> = {
  pending: "Waiting for barangay review",
  approved: "Ready for pickup on your schedule",
  completed: "Document released",
  rejected: "Request was not approved",
  cancelled: "You cancelled this request",
};

export default function ResidentServicesPage() {
  const router = useRouter();

  const [requests, setRequests] = useState<Request[]>([]);
  const [blotters, setBlotters] = useState<BlotterReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<Kind>("documents");
  const [filter, setFilter] = useState<string>("all");
  const [blotterFilter, setBlotterFilter] = useState<string>("all");

  useEffect(() => {
    queueMicrotask(() => {
      if (new URLSearchParams(window.location.search).get("tab") === "blotter") setKind("blotter");
    });
  }, []);

  const switchKind = (next: Kind) => {
    setKind(next);
    const url = new URL(window.location.href);
    if (next === "blotter") url.searchParams.set("tab", "blotter");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  };

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelSuccessModal, setShowCancelSuccessModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/login");
      return;
    }

    const [docs, reports] = await Promise.all([
      supabase.from("document_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("blotter_reports").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);

    if (!docs.error && docs.data) setRequests(docs.data as Request[]);
    if (!reports.error && reports.data) setBlotters(reports.data as BlotterReport[]);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchRequests();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchRequests]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length };
    requests.forEach((r) => {
      const s = normalizeStatus(r.status);
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [requests]);

  const visible = filter === "all" ? requests : requests.filter((r) => normalizeStatus(r.status) === filter);

  const blotterCounts = useMemo(() => {
    const c: Record<string, number> = { all: blotters.length };
    blotters.forEach((b) => {
      c[b.status] = (c[b.status] ?? 0) + 1;
    });
    return c;
  }, [blotters]);

  const visibleBlotters = blotterFilter === "all" ? blotters : blotters.filter((b) => b.status === blotterFilter);

  const openCancelModal = (id: string) => {
    const target = requests.find((r) => r.id === id);
    const st = normalizeStatus(target?.status);

    if (!target || st !== "pending") return;

    setSelectedRequestId(id);
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    if (!selectedRequestId) return;

    const { data: current, error: currentErr } = await supabase
      .from("document_requests")
      .select("status")
      .eq("id", selectedRequestId)
      .single();

    if (currentErr) {
      console.error(currentErr);
      return;
    }

    if (!current || normalizeStatus(current.status) !== "pending") {
      setShowCancelModal(false);
      setSelectedRequestId(null);
      return;
    }

    const { error } = await supabase
      .from("document_requests")
      .update({ status: "cancelled" })
      .eq("id", selectedRequestId);

    if (error) {
      console.error(error);
      return;
    }

    setRequests((prev) => prev.map((r) => (r.id === selectedRequestId ? { ...r, status: "cancelled" } : r)));

    setShowCancelModal(false);
    setShowCancelSuccessModal(true);
  };

  if (loading) {
    return (
      <main className="kb-loader" role="status" aria-live="polite">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
          <h2>Loading your requests</h2>
          <p>Gathering your latest appointment updates...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="kb-page">
        <header className="kb-page-head">
          <div>
            <p className="kb-eyebrow">Service Tracker</p>
            <h1 className="kb-title">My requests</h1>
            <p className="kb-subtitle">Track your document requests and the blotter reports you filed.</p>
          </div>
          {kind === "documents" ? (
            <Link href="/request-document" className="kb-btn kb-btn-primary">
              <IconPlus size={18} /> New request
            </Link>
          ) : (
            <Link href="/blotter" className="kb-btn kb-btn-primary">
              <IconPlus size={18} /> File a report
            </Link>
          )}
        </header>

        <div className={styles.kindSwitch} role="tablist" aria-label="Request type">
          <button
            role="tab"
            aria-selected={kind === "documents"}
            className={`${styles.kindBtn} ${kind === "documents" ? styles.kindActive : ""}`}
            onClick={() => switchKind("documents")}
          >
            <IconDocument size={18} /> Document requests
            <span className="kb-tab-count">{requests.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={kind === "blotter"}
            className={`${styles.kindBtn} ${kind === "blotter" ? styles.kindActive : ""}`}
            onClick={() => switchKind("blotter")}
          >
            <IconScale size={18} /> Blotter reports
            <span className="kb-tab-count">{blotters.length}</span>
          </button>
        </div>

        {kind === "blotter" && (
          <>
            <div className={`kb-tabs ${styles.tabs}`} role="tablist">
              {[{ value: "all", label: "All" }, ...BLOTTER_STATUSES].map((s) => (
                <button
                  key={s.value}
                  role="tab"
                  aria-selected={blotterFilter === s.value}
                  className={`kb-tab ${blotterFilter === s.value ? "is-active" : ""}`}
                  onClick={() => setBlotterFilter(s.value)}
                >
                  {s.label}
                  <span className="kb-tab-count">{blotterCounts[s.value] ?? 0}</span>
                </button>
              ))}
            </div>

            {visibleBlotters.length === 0 ? (
              <div className="kb-card kb-empty">
                <SpotBlotter size={84} />
                <h3>{blotters.length === 0 ? "No blotter reports yet" : "No reports with this status"}</h3>
                <p>
                  {blotters.length === 0
                    ? "Reports you file with the barangay will appear here with their status."
                    : "Try another filter to see the rest of your reports."}
                </p>
                {blotters.length === 0 && (
                  <Link href="/blotter" className="kb-btn kb-btn-primary kb-btn-sm">
                    File a blotter report
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.list}>
                {visibleBlotters.map((b) => {
                  const pill = blotterStatusClass(b.status);
                  return (
                    <article
                      key={b.id}
                      className={`kb-card ${styles.card} ${styles[`accent_${pill.replace("kb-status-", "")}`] ?? ""}`}
                    >
                      <div className={styles.cardMain}>
                        <SpotBlotter size={56} />
                        <div className={styles.info}>
                          <div className={styles.titleRow}>
                            <h3>{b.incident_type}</h3>
                            <span className={`kb-status ${pill}`}>{blotterStatusLabel(b.status)}</span>
                          </div>
                          <p className={styles.hint}>
                            {b.status === "scheduled" && b.hearing_at
                              ? `Hearing on ${formatDateTime(b.hearing_at)} at the barangay hall`
                              : BLOTTER_STATUSES.find((s) => s.value === b.status)?.hint}
                          </p>
                          <div className={styles.meta}>
                            <span>
                              <IconCalendar size={15} /> {formatDate(b.incident_date)}
                              {b.incident_time ? ` · ${b.incident_time}` : ""}
                            </span>
                            <span>
                              <IconMapPin size={15} /> {b.location}
                            </span>
                            {b.case_number && <span className="kb-mono">{b.case_number}</span>}
                          </div>
                          {b.admin_remarks && (
                            <p className={styles.remarks}>
                              <strong>Barangay remarks:</strong> {b.admin_remarks}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {kind === "documents" && (
          <>
            <div className={`kb-tabs ${styles.tabs}`} role="tablist">
              {["all", ...REQUEST_STATUSES].map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={filter === s}
                  className={`kb-tab ${filter === s ? "is-active" : ""}`}
                  onClick={() => setFilter(s)}
                >
                  {s}
                  <span className="kb-tab-count">{counts[s] ?? 0}</span>
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="kb-card kb-empty">
                <SpotTrack size={84} />
                <h3>{requests.length === 0 ? "No requests yet" : `No ${filter} requests`}</h3>
                <p>
                  {requests.length === 0
                    ? "You have not submitted any requests yet. Start one in just a few steps."
                    : "Try another filter to see the rest of your requests."}
                </p>
                {requests.length === 0 && (
                  <Link href="/request-document" className="kb-btn kb-btn-primary kb-btn-sm">
                    Request a document
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.list}>
                {visible.map((req) => {
                  const st = normalizeStatus(req.status);
                  const canCancel = st === "pending";
                  const title = req.document_type === "Other Document Request" ? req.other_document : req.document_type;

                  return (
                    <article key={req.id} className={`kb-card ${styles.card} ${styles[`accent_${st}`] ?? ""}`}>
                      <div className={styles.cardMain}>
                        <DocumentSpot type={req.document_type} size={56} />
                        <div className={styles.info}>
                          <div className={styles.titleRow}>
                            <h3>{title}</h3>
                            <span className={`kb-status kb-status-${st}`}>{st}</span>
                          </div>
                          <p className={styles.hint}>{STATUS_HINT[st] ?? ""}</p>
                          <div className={styles.meta}>
                            <span>
                              <IconCalendar size={15} /> {formatDate(req.appointment_date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                            </span>
                            <span>
                              <IconClock size={15} /> {req.appointment_time}
                            </span>
                            <span className="kb-mono">#{req.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </div>

                      <div className={styles.actions}>
                        <button
                          className="kb-btn kb-btn-soft kb-btn-sm"
                          onClick={() => router.push(`/request-document/summary?id=${req.id}`)}
                        >
                          View details
                        </button>

                        {canCancel && (
                          <button className="kb-btn kb-btn-danger-soft kb-btn-sm" onClick={() => openCancelModal(req.id)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {showCancelModal &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-danger">
                <IconAlert size={30} />
              </div>
              <h3>Cancel Appointment?</h3>
              <p>This action cannot be undone.</p>

              <div className="kb-modal-actions">
                <button
                  className="kb-btn kb-btn-secondary"
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedRequestId(null);
                  }}
                >
                  Go back
                </button>

                <button className="kb-btn kb-btn-danger" onClick={confirmCancel}>
                  Confirm cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {showCancelSuccessModal &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-success">
                <IconCheckCircle size={32} />
              </div>
              <h3>Appointment Cancelled</h3>
              <p>Your appointment has been successfully cancelled.</p>

              <div className="kb-modal-actions">
                <button
                  className="kb-btn kb-btn-primary"
                  onClick={() => {
                    setShowCancelSuccessModal(false);
                    setSelectedRequestId(null);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
