"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./manage-services.module.css";
import supabase from "@/lib/supabaseClient";

type RequestRow = {
  id: string;
  user_id: string;
  full_name: string | null;
  date_of_birth: string | null;
  document_type: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  admin_remarks: string | null;
  created_at: string | null;
};

const STATUS_FILTERS = ["pending", "approved", "rejected", "cancelled", "completed"] as const;

function statusText(s: string | null) {
  return (s ?? "pending").toLowerCase();
}

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

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return requests.filter((r) => {
      const st = statusText(r.status);
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

  // ✅ Option 1: Admin uses the SAME summary page, but with an "admin=1" flag
  const goToSummary = (id: string) => {
    router.push(`/request-document/summary?id=${id}&admin=1`);
  };

  if (accessChecking) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingWrap} role="status" aria-live="polite">
          <div className={styles.loadingCard}>
            <div className={styles.loadingOrb} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
            <div className={styles.loadingTitle}>Checking admin access</div>
            <div className={styles.loadingSub}>Verifying your permissions...</div>
            <div className={styles.loadingBars} aria-hidden="true">
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Manage Request</h1>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <label className={styles.label}>Status</label>
          <select
            className={styles.select}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s} value={s}>
                {s.toUpperCase()}
              </option>
            ))}
            <option value="">ALL</option>
          </select>
        </div>

        <div className={styles.controlGroupWide}>
          <label className={styles.label}>Search</label>
          <input
            className={styles.input}
            placeholder="Search name, document type, or request id"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className={styles.refreshBtn} onClick={refreshRequests} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className={styles.errorBox}>⚠ {error}</div>}

      <div className={styles.list}>
        {loading ? (
          <div className={styles.loadingWrap} role="status" aria-live="polite">
            <div className={styles.loadingCard}>
              <div className={styles.loadingOrb} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <div className={styles.loadingTitle}>Loading requests</div>
              <div className={styles.loadingSub}>Fetching the latest updates...</div>
              <div className={styles.loadingBars} aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div>No requests found.</div>
        ) : (
          filtered.map((r) => {
            const st = statusText(r.status);
            const isCancelled = st === "cancelled";
            const isCompleted = st === "completed";
            const isApproved = st === "approved";

            // If cancelled OR completed, disable View/Approve/Reject
            const disablePrimary = actionLoading || isCancelled || isCompleted;

            return (
              <div key={r.id} className={styles.card}>
                <div className={styles.info}>
                  <p className={styles.rowTitle}>{r.document_type ?? "—"}</p>

                  <p>
                    <b>Name:</b> {r.full_name ?? "—"}
                  </p>

                  <p>
                    <b>Schedule:</b> {r.appointment_date ?? "—"} • {r.appointment_time ?? "—"}
                  </p>

                  <p>
                    <b>Request ID:</b> <span className={styles.mono}>{r.id}</span>
                  </p>

                  <div className={styles.status}>
                    <span className={`${styles.statusDot} ${styles[st]}`} />
                    <span>{st.toUpperCase()}</span>
                  </div>

                  {isApproved && (
                    <p className={styles.approvedMsg}>
                      You can now pick up your document at your chosen date
                      <br />
                      and time.
                    </p>
                  )}
                </div>

                <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.viewBtn} disabled={disablePrimary} onClick={() => goToSummary(r.id)}>
                    View Info
                  </button>

                  <button
                    className={styles.approveBtn}
                    disabled={disablePrimary || isApproved || st === "rejected"}
                    onClick={() => updateStatus(r.id, "approved")}
                  >
                    Approve
                  </button>

                  <button
                    className={styles.rejectBtn}
                    disabled={disablePrimary || st === "rejected" || isApproved}
                    onClick={() => updateStatus(r.id, "rejected")}
                  >
                    Reject
                  </button>

                  {isCancelled ? (
                    <button className={styles.cancelledBtn} disabled>
                      Cancelled
                    </button>
                  ) : isCompleted ? (
                    <button className={styles.completedBtn} disabled>
                      Completed
                    </button>
                  ) : (
                    <button
                      className={styles.completeBtn}
                      disabled={actionLoading || !isApproved}
                      onClick={() => updateStatus(r.id, "completed")}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
