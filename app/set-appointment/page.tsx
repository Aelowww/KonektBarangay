"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./set-appointment.module.css";
import Stepper from "../components/Stepper";
import { useResidentOnly } from "../components/useResidentOnly";
import {
  DocumentSpot,
  IconAlert,
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClock,
  IconInfo,
} from "../components/icons";

type ModalReason = "DOCUMENT" | "DATETIME" | null;

const TIME_SLOTS = {
  Morning: ["8:00 – 9:00 AM", "9:00 – 10:00 AM", "10:00 – 11:00 AM"],
  Afternoon: ["1:00 – 2:00 PM", "2:00 – 3:00 PM", "3:00 – 4:00 PM"],
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SetAppointment() {
  const router = useRouter();
  const blocked = useResidentOnly();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalReason, setModalReason] = useState<ModalReason>(null);
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = JSON.parse(localStorage.getItem("documentRequest") || "null");
        setDocumentType(stored?.documentType ?? null);
      } catch {
        setDocumentType(null);
      }
      setCheckedStorage(true);
    });
  }, []);

  const hasDocument = !!documentType;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("en-US", { month: "long" });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
  const canGoPrev = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth());

  const prevMonth = () => {
    if (!canGoPrev) return;
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const requireDocument = () => {
    if (!hasDocument) {
      setModalMessage("Please select a document first.");
      setModalReason("DOCUMENT");
      setShowWarning(true);
      return false;
    }

    return true;
  };

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
      setModalMessage("Please select a date and time first.");
      setModalReason("DATETIME");
      setShowWarning(true);
      return;
    }

    if (!requireDocument()) return;

    const existing = JSON.parse(localStorage.getItem("documentRequest") || "{}");

    const appointment = new Date(year, month, selectedDate);
    const appointmentDate = `${appointment.getFullYear()}-${String(appointment.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(appointment.getDate()).padStart(2, "0")}`;
    const appointmentDateLabel = appointment.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    localStorage.setItem(
      "documentRequest",
      JSON.stringify({
        ...existing,
        appointmentDate,
        appointmentDateLabel,
        appointmentTime: selectedTime,
      })
    );

    router.push("/request-document/summary");
  };

  const selectedLabel = selectedDate
    ? new Date(year, month, selectedDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (blocked) return null;

  return (
    <>
      <div className="kb-page">
        <Stepper current={2} />

        <header className="kb-page-head">
          <div>
            <p className="kb-eyebrow">Step 2 of 3</p>
            <h1 className="kb-title">Set an appointment</h1>
            <p className="kb-subtitle">Choose your preferred pickup date and time at the barangay hall.</p>
          </div>
          <Link href="/request-document" className="kb-btn kb-btn-ghost kb-btn-sm">
            <IconArrowLeft size={16} /> Change document
          </Link>
        </header>

        <div className={styles.layout}>
          <section className={`kb-card ${styles.calendarCard}`}>
            <div className="kb-card-head">
              <h2>
                <IconCalendar size={18} /> Select date
              </h2>
              <div className={styles.monthNav}>
                <button onClick={prevMonth} disabled={!canGoPrev} aria-label="Previous month">
                  <IconChevronLeft size={18} />
                </button>
                <span>
                  {monthName} {year}
                </span>
                <button onClick={nextMonth} aria-label="Next month">
                  <IconChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className={styles.calendarBody}>
              <div className={styles.weekDays}>
                {DAYS_OF_WEEK.map((day, i) => (
                  <div key={day} className={i === 0 || i === 6 ? styles.weekendHead : ""}>
                    {day}
                  </div>
                ))}
              </div>

              <div className={styles.calendarGrid}>
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}

                {Array.from({ length: daysInMonth }, (_, i) => {
                  const dayNumber = i + 1;
                  const columnIndex = (firstDayOfMonth + i) % 7;
                  const isWeekend = columnIndex === 0 || columnIndex === 6;
                  const isPast = new Date(year, month, dayNumber) < todayStart;
                  const isToday = isCurrentMonth && dayNumber === now.getDate();
                  const disabled = isWeekend || isPast;
                  const isSelected = selectedDate === dayNumber && !disabled;

                  return (
                    <button
                      type="button"
                      key={dayNumber}
                      disabled={disabled}
                      className={`${styles.day} ${disabled ? styles.unavailableDay : ""} ${
                        isSelected ? styles.selectedDay : ""
                      } ${isToday ? styles.today : ""}`}
                      onClick={() => {
                        if (!disabled && requireDocument()) {
                          setSelectedDate(dayNumber);
                        }
                      }}
                      aria-pressed={isSelected}
                      aria-label={new Date(year, month, dayNumber).toDateString()}
                    >
                      {dayNumber}
                    </button>
                  );
                })}
              </div>

              <div className={styles.legend}>
                <span>
                  <i className={styles.dotAvailable} /> Available
                </span>
                <span>
                  <i className={styles.dotSelected} /> Selected
                </span>
                <span>
                  <i className={styles.dotToday} /> Today
                </span>
                <span>
                  <i className={styles.dotUnavailable} /> Not available
                </span>
              </div>
            </div>
          </section>

          <div className={styles.side}>
            <section className="kb-card">
              <div className="kb-card-head">
                <h2>
                  <IconClock size={18} /> Select time
                </h2>
              </div>
              <div className={styles.timeBody}>
                {Object.entries(TIME_SLOTS).map(([period, slots]) => (
                  <div key={period}>
                    <p className={styles.period}>{period}</p>
                    <div className={styles.timeSlots}>
                      {slots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          className={`${styles.timeSlot} ${selectedTime === slot ? styles.active : ""}`}
                          onClick={() => {
                            if (requireDocument()) {
                              setSelectedTime(slot);
                            }
                          }}
                          aria-pressed={selectedTime === slot}
                        >
                          <span>{slot}</span>
                          {selectedTime === slot && <IconCheck size={16} />}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={`kb-card ${styles.summary}`}>
              <div className={styles.summaryDoc}>
                <DocumentSpot type={documentType} size={48} />
                <div>
                  <small>Selected document</small>
                  <strong>{checkedStorage ? documentType ?? "None selected" : "…"}</strong>
                </div>
              </div>
              <dl className={styles.summaryList}>
                <div>
                  <dt>Date</dt>
                  <dd>{selectedLabel ?? "—"}</dd>
                </div>
                <div>
                  <dt>Time</dt>
                  <dd>{selectedTime || "—"}</dd>
                </div>
              </dl>
              <p className={styles.officeNote}>
                <IconInfo size={15} /> Office hours: Monday – Friday, 8:00 AM – 5:00 PM
              </p>
              <div className={styles.actions}>
                <button
                  type="button"
                  className="kb-btn kb-btn-secondary"
                  onClick={() => {
                    setSelectedDate(null);
                    setSelectedTime("");
                  }}
                >
                  Clear
                </button>
                <button type="button" className="kb-btn kb-btn-primary" onClick={handleConfirm}>
                  Continue <IconArrowRight size={16} />
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>

      {showWarning &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <button className="kb-modal-close" onClick={() => setShowWarning(false)} aria-label="Close">
                ✕
              </button>
              <div className="kb-modal-icon is-warning">
                <IconAlert size={30} />
              </div>
              <h3>Action Required</h3>
              <p>{modalMessage}</p>
              <div className="kb-modal-actions">
                <button
                  className="kb-btn kb-btn-primary"
                  onClick={() => {
                    setShowWarning(false);

                    if (modalReason === "DOCUMENT") {
                      router.push("/request-document");
                    }
                  }}
                >
                  {modalReason === "DOCUMENT" ? "Choose a document" : "OK"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
