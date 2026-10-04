"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "../../../lib/supabaseClient";
import styles from "./summary.module.css";
import Stepper from "../../components/Stepper";
import { useResidentOnly } from "../../components/useResidentOnly";
import { useAuth } from "../../components/AuthProvider";
import { normalizeStatus } from "../../../lib/documents";
import {
  DocumentSpot,
  IconAlert,
  IconArrowLeft,
  IconCalendar,
  IconCheckCircle,
  IconClock,
  IconInfo,
} from "../../components/icons";

type DocumentRequest = {
  documentType?: string;
  appointmentDate?: string;
  appointmentDateLabel?: string;
  appointmentTime?: string;
  status?: string;
};

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const MAX_PENDING_REQUESTS = 3;

function requestLimitMessage(lower: string) {
  if (lower.includes("kb_pending_limit"))
    return `You already have ${MAX_PENDING_REQUESTS} pending requests. Please wait for them to be processed.`;
  if (lower.includes("kb_duplicate")) return "You already have a pending request for this document.";
  if (lower.includes("kb_daily_limit")) return "You've reached today's request limit. Please try again tomorrow.";
  if (lower.includes("kb_bad_date")) return "Please choose a weekday that is today or later.";
  if (lower.includes("kb_too_long")) return "Some fields are too long. Please shorten your entries.";
  if (lower.includes("kb_unverified")) return "Please verify your email address before submitting requests.";
  if (lower.includes("kb_not_approved")) return "Your account is still awaiting barangay verification.";
  if (lower.includes("kb_admin")) return "Administrator accounts cannot file document requests.";
  return null;
}

function isExactIsoDate(value: string) {
  if (!ISO_DATE_REGEX.test(value)) return false;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function toDateLabel(value?: string) {
  if (!value) return "";

  if (ISO_DATE_REGEX.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function normalizeDob(value: string) {
  const trimmed = value.trim();
  if (isExactIsoDate(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return null;

  const [, mm, dd, yyyy] = match;
  const month = Number(mm);
  const day = Number(dd);
  const year = Number(yyyy);

  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) {
    return null;
  }

  const normalized = `${yyyy}-${mm}-${dd}`;
  return isExactIsoDate(normalized) ? normalized : null;
}

function normalizeAppointmentDate(value?: string) {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return null;

   if (isExactIsoDate(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  const normalized = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(parsed.getDate()).padStart(2, "0")}`;

  return isExactIsoDate(normalized) ? normalized : null;
}

function SummaryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isClient = typeof window !== "undefined";

  const requestId = searchParams.get("id");
  const adminFlag = searchParams.get("admin");
  const isAdminView = adminFlag === "1";
  const isViewMode = Boolean(requestId);
  const blocked = useResidentOnly(!isViewMode);
  const { verification } = useAuth();
  const backPath = isAdminView ? "/admin/manage-services" : "/resident/manage-services";

  const [data, setData] = useState<DocumentRequest | null>(null);
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [purpose, setPurpose] = useState("");
  const [otherDocument, setOtherDocument] = useState("");

  const [showExitModal, setShowExitModal] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [noticeRedirect, setNoticeRedirect] = useState<string | null>(null);

  const openNotice = useCallback((title: string, message: string, redirectTo?: string) => {
    setNoticeTitle(title);
    setNoticeMessage(message);
    setNoticeRedirect(redirectTo ?? null);
    setShowNoticeModal(true);
  }, []);

  useEffect(() => {
    if (isViewMode && requestId) {
      const loadViewRequest = async () => {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/login");
          return;
        }

        if (isAdminView) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          const role = (profile?.role ?? "").toLowerCase();
          if (profileError || role !== "admin") {
            router.replace("/manage-services");
            return;
          }
        }

        const { data, error } = await supabase
          .from("document_requests")
          .select("*")
          .eq("id", requestId)
          .single();

        if (error || !data) {
          openNotice("Request Not Found", "The selected request could not be found.", backPath);
          return;
        }

        setData({
          documentType: data.document_type,
          appointmentDate: data.appointment_date,
          appointmentDateLabel: toDateLabel(data.appointment_date ?? ""),
          appointmentTime: data.appointment_time,
          status: data.status,
        });

        setFullName(data.full_name ?? "");
        if (ISO_DATE_REGEX.test(data.date_of_birth ?? "")) {
          const [year, month, day] = (data.date_of_birth as string).split("-");
          setDob(`${month}-${day}-${year}`);
        } else {
          setDob(data.date_of_birth ?? "");
        }
        setPurpose(data.purpose ?? "");
        setOtherDocument(data.other_document || "");
      };

      void loadViewRequest();
      return;
    }

    supabase.auth.getSession().then(({ data: auth }) => {
      if (!auth.session) {
        router.push("/request-document");
        return;
      }

      const stored = localStorage.getItem("documentRequest");
      if (!stored) {
        router.push("/request-document");
        return;
      }

      const parsed: DocumentRequest = JSON.parse(stored);
      if (!parsed.documentType || !parsed.appointmentDate || !parsed.appointmentTime) {
        router.push("/request-document");
        return;
      }

      setData({
        ...parsed,
        appointmentDateLabel:
          parsed.appointmentDateLabel ?? toDateLabel(parsed.appointmentDate),
      });

      const meta = auth.session.user.user_metadata ?? {};
      if (meta.username && typeof meta.full_name === "string") {
        setFullName((prev) => prev || meta.full_name);
      }
    });
  }, [router, isViewMode, requestId, backPath, openNotice, isAdminView]);

  useEffect(() => {
    const hasOpenModal = showValidationModal || showSubmitModal || showNoticeModal || (!isViewMode && showExitModal);
    if (!hasOpenModal) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showValidationModal, showSubmitModal, showNoticeModal, showExitModal, isViewMode]);

  useEffect(() => {
    if (isViewMode) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      if (target.closest(".kb-modal")) return;
      if (target.closest("[data-submit]")) return;

      const link = target.closest("a") as HTMLAnchorElement | null;
      if (!link?.href) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setPendingHref(link.href);
      setShowExitModal(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
    };
  }, [isViewMode]);

  if (!data || blocked) return null;

  const handleLeavePage = () => {
    localStorage.removeItem("documentRequest");
    if (pendingHref) {
      window.location.href = pendingHref;
      return;
    }
    router.push("/request-document");
  };

  const handleSubmit = async () => {
    if (isSubmitting) {
      return;
    }

    const trimmedFullName = fullName.trim();
    const trimmedDob = dob.trim();
    const trimmedPurpose = purpose.trim();
    const trimmedOtherDocument = otherDocument.trim();

    if (
      !trimmedFullName ||
      !trimmedDob ||
      !trimmedPurpose ||
      !data.documentType ||
      !data.appointmentTime ||
      (data.documentType === "Other Document Request" && !trimmedOtherDocument)
    ) {
      setShowValidationModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        openNotice("Login Required", "You must be logged in.");
        return;
      }

      const formattedDOB = normalizeDob(trimmedDob);
      if (!formattedDOB) {
        openNotice(
          "Invalid Date of Birth",
          "Please enter a valid date of birth in MM-DD-YYYY format."
        );
        return;
      }

      const formattedAppointmentDate = normalizeAppointmentDate(
        data.appointmentDate
      );
      if (!formattedAppointmentDate) {
        openNotice(
          "Invalid Appointment Date",
          "Please reselect your appointment date and time."
        );
        return;
      }

      if (verification && verification !== "approved") {
        openNotice(
          verification === "rejected" ? "Account Not Approved" : "Verification In Progress",
          verification === "rejected"
            ? "Please visit the barangay hall with a valid ID so staff can verify your account."
            : "The barangay is still verifying your account. You can submit requests once it's approved."
        );
        return;
      }

      const { data: pendingRows } = await supabase
        .from("document_requests")
        .select("document_type, status")
        .eq("user_id", user.id)
        .eq("status", "pending");

      const pending = pendingRows ?? [];
      if (pending.length >= MAX_PENDING_REQUESTS) {
        openNotice(
          "Too Many Pending Requests",
          `You already have ${MAX_PENDING_REQUESTS} pending requests. Please wait for the barangay to process them, or cancel one in My Requests.`
        );
        return;
      }
      if (
        data.documentType !== "Other Document Request" &&
        pending.some((r) => r.document_type === data.documentType)
      ) {
        openNotice(
          "Duplicate Request",
          `You already have a pending ${data.documentType} request. Please wait for it to be processed.`
        );
        return;
      }

      const { error } = await supabase
        .from("document_requests")
        .insert({
          user_id: user.id,
          full_name: trimmedFullName,
          date_of_birth: formattedDOB,
          document_type: data.documentType,
          other_document:
            data.documentType === "Other Document Request"
              ? trimmedOtherDocument
              : null,
          purpose: trimmedPurpose,
          appointment_date: formattedAppointmentDate,
          appointment_time: data.appointmentTime,
          status: "pending",
        });

      if (error) {
        const errorDetails = error as {
          details?: string;
          hint?: string;
          code?: string;
        };
        console.error("Submit request error", {
          message: error.message,
          code: errorDetails.code,
          details: errorDetails.details,
          hint: errorDetails.hint,
        });

        const lowerMessage = [error.message, errorDetails.details, errorDetails.hint]
          .filter(Boolean)
          .join(" ")
          .trim()
          .toLowerCase();

        let friendlyMessage = "Failed to submit request. Please try again.";
        const limitMessage = requestLimitMessage(lowerMessage);

        if (limitMessage) {
          friendlyMessage = limitMessage;
        } else if (
          lowerMessage.includes("row-level security") ||
          lowerMessage.includes("permission") ||
          lowerMessage.includes("not allowed")
        ) {
          friendlyMessage =
            "You do not have permission to submit this request right now. Please contact the barangay office.";
        } else if (
          lowerMessage.includes("failed to fetch") ||
          lowerMessage.includes("network")
        ) {
          friendlyMessage =
            "Network error while submitting request. Please check internet or open the link in Chrome instead of in-app browser.";
        }

        openNotice("Submission Failed", friendlyMessage);
        return;
      }

      localStorage.removeItem("documentRequest");
      setShowSubmitModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const status = normalizeStatus(data.status);
  const docName =
    data.documentType === "Other Document Request" && otherDocument ? otherDocument : data.documentType;

  return (
    <>
      <main className="kb-page kb-page-narrow">
        {!isViewMode && <Stepper current={3} />}

        <header className="kb-page-head">
          <div>
            <p className="kb-eyebrow">{isViewMode ? "Request Record" : "Step 3 of 3"}</p>
            <h1 className="kb-title">{isViewMode ? "Request details" : "Review your request"}</h1>
            <p className="kb-subtitle">
              {isViewMode
                ? "Below are the details of the submitted request."
                : "Complete your details and confirm everything before submitting."}
            </p>
          </div>
          {isViewMode && (
            <button className="kb-btn kb-btn-secondary kb-btn-sm" onClick={() => router.push(backPath)}>
              <IconArrowLeft size={16} /> Back to {isAdminView ? "requests" : "my requests"}
            </button>
          )}
        </header>

        <div className={styles.layout}>
          <section className={`kb-card ${styles.docCard}`}>
            <DocumentSpot type={data.documentType} size={64} />
            <div className={styles.docInfo}>
              <small>Document requested</small>
              <strong>{docName}</strong>
              {isViewMode && <span className={`kb-status kb-status-${status}`}>{status}</span>}
            </div>
            <div className={styles.schedule}>
              <div>
                <IconCalendar size={18} />
                <span>
                  <small>Date</small>
                  {data.appointmentDateLabel ?? toDateLabel(data.appointmentDate)}
                </span>
              </div>
              <div>
                <IconClock size={18} />
                <span>
                  <small>Time</small>
                  {data.appointmentTime}
                </span>
              </div>
            </div>
            {isViewMode && requestId && (
              <p className={styles.refId}>
                Ref. ID <span className="kb-mono">{requestId}</span>
              </p>
            )}
          </section>

          <section className="kb-card">
            <div className="kb-card-head">
              <h2>Requester information</h2>
            </div>
            <div className={styles.form}>
              <div className={styles.grid2}>
                <div className="kb-field">
                  <label className="kb-label" htmlFor="fullName">
                    Full name
                  </label>
                  <input
                    id="fullName"
                    className="kb-input"
                    maxLength={120}
                    type="text"
                    value={fullName}
                    readOnly={isViewMode}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                  />
                </div>

                <div className="kb-field">
                  <label className="kb-label" htmlFor="dob">
                    Date of birth <small>(MM-DD-YYYY)</small>
                  </label>
                  <input
                    id="dob"
                    className="kb-input"
                    type="text"
                    inputMode="numeric"
                    value={dob}
                    readOnly={isViewMode}
                    placeholder="MM-DD-YYYY"
                    maxLength={10}
                    onChange={(e) => {
                      if (isViewMode) return;

                      let value = e.target.value.replace(/\D/g, "");
                      if (value.length > 2 && value.length <= 4) {
                        value = `${value.slice(0, 2)}-${value.slice(2)}`;
                      } else if (value.length > 4) {
                        value = `${value.slice(0, 2)}-${value.slice(2, 4)}-${value.slice(4, 8)}`;
                      }
                      setDob(value);
                    }}
                  />
                </div>
              </div>

              {data.documentType === "Other Document Request" && (
                <div className="kb-field">
                  <label className="kb-label" htmlFor="otherDoc">
                    Specify other document
                  </label>
                  <textarea
                    id="otherDoc"
                    className="kb-textarea"
                    maxLength={200}
                    value={otherDocument}
                    readOnly={isViewMode}
                    onChange={(e) => setOtherDocument(e.target.value)}
                    placeholder="Please specify the document you are requesting"
                    rows={3}
                  />
                </div>
              )}

              <div className="kb-field">
                <label className="kb-label" htmlFor="purpose">
                  Purpose of request
                </label>
                <textarea
                  id="purpose"
                  className="kb-textarea"
                  maxLength={500}
                  value={purpose}
                  readOnly={isViewMode}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. Employment requirement, school enrollment, bank account opening"
                  rows={4}
                />
              </div>

              {!isViewMode && (
                <>
                  <p className={styles.note}>
                    <IconInfo size={16} /> Please bring a valid ID when claiming your document at the barangay hall.
                  </p>
                  <div className={styles.actions}>
                    <button
                      className="kb-btn kb-btn-secondary"
                      disabled={isSubmitting}
                      onClick={() => {
                        setPendingHref(null);
                        setShowExitModal(true);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      data-submit
                      className="kb-btn kb-btn-primary"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? "Submitting..." : "Submit request"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </section>
        </div>
      </main>

      {isClient &&
        showValidationModal &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-warning">
                <IconAlert size={30} />
              </div>
              <h3>Incomplete Information</h3>
              <p>Please complete all required fields.</p>
              <div className="kb-modal-actions">
                <button className="kb-btn kb-btn-primary" onClick={() => setShowValidationModal(false)}>
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isClient &&
        showSubmitModal &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-success">
                <IconCheckCircle size={32} />
              </div>
              <h3>Request Submitted</h3>
              <p>Your document request has been submitted. Please wait for barangay approval.</p>
              <div className="kb-modal-actions">
                <button className="kb-btn kb-btn-primary" onClick={() => router.push("/resident/manage-services")}>
                  View my requests
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isClient &&
        showNoticeModal &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-warning">
                <IconAlert size={30} />
              </div>
              <h3>{noticeTitle}</h3>
              <p>{noticeMessage}</p>
              <div className="kb-modal-actions">
                <button
                  className="kb-btn kb-btn-primary"
                  onClick={() => {
                    setShowNoticeModal(false);
                    if (noticeRedirect) router.push(noticeRedirect);
                  }}
                >
                  OK
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isClient &&
        !isViewMode &&
        showExitModal &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-danger">
                <IconAlert size={30} />
              </div>
              <h3>Leave page?</h3>
              <p>If you leave now, your entered information will not be saved.</p>
              <div className="kb-modal-actions">
                <button
                  className="kb-btn kb-btn-secondary"
                  onClick={() => {
                    setPendingHref(null);
                    setShowExitModal(false);
                  }}
                >
                  Stay
                </button>
                <button className="kb-btn kb-btn-danger" onClick={handleLeavePage}>
                  Leave page
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={null}>
      <SummaryPageContent />
    </Suspense>
  );
}
