"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./manage-services.module.css";
import supabase from "@/lib/supabaseClient";
import { formatDate, normalizeStatus } from "@/lib/documents";
import {
  DocumentSpot,
  IconAlert,
  IconCheck,
  IconCheckCircle,
  IconClipboard,
  IconClock,
  IconClose,
  IconEye,
  IconInbox,
  IconRefresh,
  IconSearch,
  SpotTrack,
} from "@/app/components/icons";

type RequestRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  date_of_birth: string | null;
  document_type: string | null;
  other_document?: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  admin_remarks: string | null;
  created_at: string | null;
};

const STATUS_FILTERS = ["pending", "approved", "rejected", "cancelled", "completed"] as const;

export default function AdminManageServicesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [accessChecking, setAccessChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [search, setSearch] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const loadRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from("document_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setRequests([]);
      setLoading(false);
      return;
    }

    setRequests((data ?? []) as RequestRow[]);
    setLoading(false);
  }, []);

  const refreshRequests = async () => {
    setLoading(true);
    setError(null);
    await loadRequests();
  };

  useEffect(() => {
    let active = true;

    const gateAdminAccess = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        if (active) {
          setAccessChecking(false);
          setLoading(false);
          router.replace("/login");
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      const role = (profile?.role ?? "").toLowerCase();

      if (profileError || role !== "admin") {
        if (active) {
          setAccessChecking(false);
          setLoading(false);
          router.replace("/manage-services");
        }
        return;
      }

      if (active) {
        setAuthorized(true);
        setAccessChecking(false);
        await loadRequests();
      }
    };

    void gateAdminAccess();

    return () => {
      active = false;
    };
  }, [loadRequests, router]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    const channel = supabase
      .channel("admin-document-requests")
      .on("postgres_changes", { event: "*", schema: "public", table: "document_requests" }, () =>
        void loadRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authorized, loadRequests]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { "": requests.length };
    requests.forEach((r) => {
      const s = normalizeStatus(r.status);
      c[s] = (c[s] ?? 0) + 1;
    });
    return c;
  }, [requests]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return requests.filter((r) => {
      const st = normalizeStatus(r.status);
      const matchStatus = filterStatus ? st === filterStatus : true;

      const matchSearch =
        !s ||
        (r.full_name ?? "").toLowerCase().includes(s) ||
        (r.document_type ?? "").toLowerCase().includes(s) ||
        (r.id ?? "").toLowerCase().includes(s);

      return matchStatus && matchSearch;
    });
  }, [requests, filterStatus, search]);

  const updateStatus = async (id: string, nextStatus: string) => {
    setActionLoading(true);
    setError(null);

    const { error } = await supabase.from("document_requests").update({ status: nextStatus }).eq("id", id);

    if (error) {
      setError(error.message);
      setActionLoading(false);
      return;
    }

    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)));
    setActionLoading(false);
  };

  const goToSummary = (id: string) => {
    router.push(`/request-document/summary?id=${id}&admin=1`);
  };

  if (accessChecking) {
    return (
      <div className="kb-loader" role="status" aria-live="polite">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
          <h2>Loading requests</h2>
          <p>Fetching the latest updates...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  const kpis = [
    { label: "Total Requests", value: counts[""] ?? 0, icon: IconInbox, tone: "brand" },
    { label: "Pending", value: counts.pending ?? 0, icon: IconClock, tone: "warning" },
    { label: "Approved", value: counts.approved ?? 0, icon: IconCheckCircle, tone: "brand" },
    { label: "Completed", value: counts.completed ?? 0, icon: IconClipboard, tone: "success" },
  ];

  return (
    <div className="kb-page">
      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Administration</p>
          <h1 className="kb-title">Manage requests</h1>
          <p className="kb-subtitle">Review, approve, and release resident document requests.</p>
        </div>
        <button className="kb-btn kb-btn-secondary" onClick={refreshRequests} disabled={loading}>
          <IconRefresh size={17} className={loading ? styles.spin : ""} /> {loading ? "Loading..." : "Refresh"}
        </button>
      </header>

      <section className={styles.kpis}>
        {kpis.map(({ label, value, icon: Icon, tone }) => (
          <article key={label} className={`${styles.kpi} ${styles[`tone_${tone}`]}`}>
            <span className={styles.kpiIcon}>
              <Icon size={20} />
            </span>
            <div>
              <p>{label}</p>
              <strong>{value}</strong>
            </div>
          </article>
        ))}
      </section>

      <section className="kb-card">
        <div className={styles.toolbar}>
          <div className="kb-tabs" role="tablist">
            {[...STATUS_FILTERS, ""].map((s) => (
              <button
                key={s || "all"}
                role="tab"
                aria-selected={filterStatus === s}
                className={`kb-tab ${filterStatus === s ? "is-active" : ""}`}
                onClick={() => setFilterStatus(s)}
              >
                {s || "All"}
                <span className="kb-tab-count">{counts[s] ?? 0}</span>
              </button>
            ))}
          </div>

          <div className={`kb-input-wrap ${styles.search}`}>
            <IconSearch size={18} />
            <input
              className="kb-input"
              placeholder="Search name, document, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search requests"
            />
          </div>
        </div>

        {error && (
          <div className="kb-alert" style={{ margin: "0 20px 16px" }}>
            <IconAlert size={18} /> {error}
          </div>
        )}

        {loading ? (
          <div className={styles.skeletons}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="kb-skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="kb-empty">
            <SpotTrack size={80} />
            <h3>No requests found</h3>
            <p>There are no {filterStatus || ""} requests matching your search.</p>
          </div>
        ) : (
          <div className={styles.table} role="table">
            <div className={styles.thead} role="row">
              <span role="columnheader">Document</span>
              <span role="columnheader">Resident</span>
              <span role="columnheader">Schedule</span>
              <span role="columnheader">Status</span>
              <span role="columnheader" className={styles.alignRight}>
                Actions
              </span>
            </div>

            {filtered.map((r) => {
              const st = normalizeStatus(r.status);
              const isCancelled = st === "cancelled";
              const isCompleted = st === "completed";
              const isApproved = st === "approved";
              const isRejected = st === "rejected";

              const disablePrimary = actionLoading || isCancelled || isCompleted;
              const docTitle =
                r.document_type === "Other Document Request" && r.other_document ? r.other_document : r.document_type;

              return (
                <div key={r.id} className={styles.row} role="row">
                  <div className={styles.docCell} role="cell">
                    <DocumentSpot type={r.document_type} size={42} />
                    <div>
                      <strong>{docTitle ?? "—"}</strong>
                      <span className="kb-mono">#{r.id.slice(0, 8)}</span>
                    </div>
                  </div>

                  <div className={styles.cell} role="cell">
                    <span className={styles.cellLabel}>Resident</span>
                    <strong>{r.full_name ?? "—"}</strong>
                    <small>Filed {formatDate(r.created_at)}</small>
                  </div>

                  <div className={styles.cell} role="cell">
                    <span className={styles.cellLabel}>Schedule</span>
                    <strong>{formatDate(r.appointment_date)}</strong>
                    <small>{r.appointment_time ?? "—"}</small>
                  </div>

                  <div className={styles.cell} role="cell">
                    <span className={styles.cellLabel}>Status</span>
                    <span className={`kb-status kb-status-${st}`}>{st}</span>
                    {isApproved && <small className={styles.approvedMsg}>Ready for pickup</small>}
                  </div>

                  <div className={styles.actions} role="cell">
                    <button
                      className={styles.iconAction}
                      disabled={disablePrimary}
                      onClick={() => goToSummary(r.id)}
                      title="View info"
                      aria-label="View info"
                    >
                      <IconEye size={17} />
                    </button>

                    {st === "pending" && (
                      <>
                        <button
                          className="kb-btn kb-btn-success kb-btn-sm"
                          disabled={disablePrimary || isApproved || isRejected}
                          onClick={() => updateStatus(r.id, "approved")}
                        >
                          <IconCheck size={15} /> Approve
                        </button>
                        <button
                          className="kb-btn kb-btn-danger-soft kb-btn-sm"
                          disabled={disablePrimary || isRejected || isApproved}
                          onClick={() => updateStatus(r.id, "rejected")}
                        >
                          <IconClose size={14} /> Reject
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <button
                        className="kb-btn kb-btn-primary kb-btn-sm"
                        disabled={actionLoading}
                        onClick={() => updateStatus(r.id, "completed")}
                      >
                        Mark completed
                      </button>
                    )}

                    {(isCancelled || isCompleted || isRejected) && (
                      <span className={styles.finalNote}>
                        {isCompleted ? "Released" : isCancelled ? "Cancelled by resident" : "Rejected"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
