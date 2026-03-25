"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import supabase from "../../../lib/supabaseClient";
import styles from "./summary.module.css";

type DocumentRequest = {
  documentType?: string;
  appointmentDate?: string;
  appointmentDateLabel?: string;
  appointmentTime?: string;
};

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

      if (target.closest(`.${styles.modal}`)) return;
      if (target.closest(`.${styles.confirm}`)) return;

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

  if (!data) return null;

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

        if (
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

  return (
    <>
      <main className={styles.page}>
        <div className={styles.summaryBox}>
          {isViewMode && (
            <button className={styles.closeBtn} onClick={() => router.push(backPath)} aria-label="Close">
              x
            </button>
          )}

          <h1>{isViewMode ? "Request Details" : "Request Summary"}</h1>
          <p className={styles.subtitle}>
            {isViewMode
              ? "Below are the details of the submitted request."
              : "Please review your request details before submission."}
          </p>

          <div className={styles.field}>
            <label>Full Name:</label>
            <input
              type="text"
              value={fullName}
              readOnly={isViewMode}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          <div className={styles.field}>
            <label>Date of Birth:</label>
            <input
              type="text"
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

          <div className={styles.detail}>
            <strong>Document Requested:</strong>
            <p>{data.documentType}</p>
          </div>

          {data.documentType === "Other Document Request" && (
            <div className={styles.field}>
              <label>Specify Other Document:</label>
              <textarea
                value={otherDocument}
                readOnly={isViewMode}
                onChange={(e) => setOtherDocument(e.target.value)}
                placeholder="Please specify the document you are requesting"
                rows={4}
              />
            </div>
          )}

          <div className={styles.detail}>
            <strong>Appointment Date:</strong>
            <p>{data.appointmentDateLabel ?? toDateLabel(data.appointmentDate)}</p>
          </div>

          <div className={styles.detail}>
            <strong>Appointment Time:</strong>
            <p>{data.appointmentTime}</p>
          </div>

          <div className={styles.field}>
            <label>Purpose of Request:</label>
            <textarea
              value={purpose}
              readOnly={isViewMode}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="State your reason for requesting this document"
              rows={4}
            />
          </div>

          <div className={styles.summaryActions}>
            {!isViewMode && (
              <button
                className={styles.cancel}
                disabled={isSubmitting}
                onClick={() => {
                  setPendingHref(null);
                  setShowExitModal(true);
                }}
              >
                Cancel
              </button>
            )}

            {!isViewMode && (
              <button
                className={styles.confirm}
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Submitting..." : "Submit"}
              </button>
            )}
          </div>
        </div>
      </main>

      {isClient &&
        showValidationModal &&
        createPortal(
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.warningModal} ${styles.validationModal}`}>
              <h3>Incomplete Information</h3>
              <p>Please complete all required fields.</p>
              <div className={styles.modalActions}>
                <button className={styles.modalContinue} onClick={() => setShowValidationModal(false)}>
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
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <h3>Request Submitted</h3>
              <p>
                Your document request has been submitted.
                <br />
                Please wait for barangay approval.
              </p>
              <div className={styles.modalActions}>
                <button className={styles.modalContinue} onClick={() => router.push("/resident/manage-services")}>
                  Continue
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {isClient &&
        showNoticeModal &&
        createPortal(
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.warningModal}`}>
              <h3>{noticeTitle}</h3>
              <p>{noticeMessage}</p>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalContinue}
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
          <div className={styles.modalOverlay}>
            <div className={`${styles.modal} ${styles.warningModal}`}>
              <h3>Leave page?</h3>
              <p>If you leave now, your entered information will not be saved.</p>
              <div className={styles.modalActions}>
                <button
                  className={styles.modalContinue}
                  onClick={() => {
                    setPendingHref(null);
                    setShowExitModal(false);
                  }}
                >
                  Continue
                </button>
                <button className={styles.modalLeave} onClick={handleLeavePage}>
                  Leave Page
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
