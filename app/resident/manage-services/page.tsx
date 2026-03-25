"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import supabase from "../../../lib/supabaseClient";
import styles from "./manage-services.module.css";

type Request = {
  id: string;
  user_id: string;
  document_type: string;
  other_document: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string;
};

export default function ResidentServicesPage() {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);

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

    const { data, error } = await supabase
      .from("document_requests")
      .select("*")
      .eq("user_id", user.id) // ✅ only fetch this user's requests
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data as Request[]);
    }

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

  const openCancelModal = (id: string) => {
    const target = requests.find((r) => r.id === id);
    const st = (target?.status ?? "pending").toLowerCase();

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

    if (!current || (current.status ?? "").toLowerCase() !== "pending") {
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

    setRequests((prev) =>
      prev.map((r) => (r.id === selectedRequestId ? { ...r, status: "cancelled" } : r))
    );

    setShowCancelModal(false);
    setShowCancelSuccessModal(true);
  };

  if (loading) {
    return (
      <main className={styles.loadingScreen} role="status" aria-live="polite">
        <div className={styles.loadingCard}>
          <div className={styles.loadingOrb} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2 className={styles.loadingTitle}>Loading your requests</h2>
          <p className={styles.loadingSub}>Gathering your latest appointment updates...</p>
          <div className={styles.loadingBars} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className={styles.page}>
        <h1 className={styles.title}>My Service Requests</h1>

        {requests.length === 0 ? (
          <p>You have not submitted any requests yet.</p>
        ) : (
          <div className={styles.list}>
            {requests.map((req) => {
              const st = (req.status ?? "pending").toLowerCase();
              const canCancel = st === "pending";

              return (
                <div key={req.id} className={styles.card}>
                  <div className={styles.info}>
                    <p>
                      <strong>Document:</strong>{" "}
                      {req.document_type === "Other Document Request"
                        ? req.other_document
                        : req.document_type}
                    </p>

                    <p>
                      <strong>Appointment Date:</strong> {req.appointment_date}
                    </p>

                    <p>
                      <strong>Appointment Time:</strong> {req.appointment_time}
                    </p>

                    <p>
                      <strong>Request ID:</strong>{" "}
                      <span className={styles.mono}>{req.id}</span>
                    </p>

                    <p className={styles.status}>
                      Status: {st.toUpperCase()}
                      <span className={`${styles.statusDot} ${styles[st]}`} />
                    </p>
                  </div>

                  <div className={styles.actions}>
                    <button
                      className={styles.viewBtn}
                      onClick={() => router.push(`/request-document/summary?id=${req.id}`)}
                    >
                      View Request
                    </button>

                    <button
                      className={styles.cancelBtn}
                      disabled={!canCancel}
                      onClick={() => openCancelModal(req.id)}
                    >
                      Cancel Appointment
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={styles.mobileMenuSpacer} aria-hidden="true" />
      </main>

      {isClient &&
        showCancelModal &&
        createPortal(
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.warningModal}`}>
              <h3>Cancel Appointment?</h3>
              <p>This action cannot be undone.</p>

              <div className={styles.modalActions}>
                <button
                  className={styles.modalContinue}
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedRequestId(null);
                  }}
                >
                  Go Back
                </button>

                <button className={styles.modalLeave} onClick={confirmCancel}>
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isClient &&
        showCancelSuccessModal &&
        createPortal(
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Appointment Cancelled</h3>
              <p>Your appointment has been successfully cancelled.</p>

              <div className={styles.modalActions}>
                <button
                  className={styles.modalContinue}
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
