"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import styles from "./set-appointment.module.css";

import {
  FiCalendar,
  FiClock,
  FiInfo,
  FiBriefcase,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

type ModalReason = "DOCUMENT" | "DATETIME" | null;

export default function SetAppointment() {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalReason, setModalReason] = useState<ModalReason>(null);

  const [hasDocument] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem("documentRequest")
  );

  const timeSlots = [
    "8:00 – 9:00 AM",
    "9:00 – 10:00 AM",
    "10:00 – 11:00 AM",
    "1:00 – 2:00 PM",
    "2:00 – 3:00 PM",
    "3:00 – 4:00 PM",
  ];

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
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

    const existing = JSON.parse(
      localStorage.getItem("documentRequest") || "{}"
    );

    const appointment = new Date(year, month, selectedDate);
    const appointmentDate = `${appointment.getFullYear()}-${String(
      appointment.getMonth() + 1
    ).padStart(2, "0")}-${String(appointment.getDate()).padStart(2, "0")}`;
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

  return (
    <>
      <div className={styles.container}>
        <h1 className={`${styles.title} ${styles.appointmentTitle}`}>
          Set an Appointment
        </h1>

        <p className={`${styles.subtitle} ${styles.appointmentSubtitle}`}>
          Choose your preferred date and time.
        </p>

        <div className={styles.content}>
          <div className={styles.calendarSection}>
            <h3 className={styles.boxTitle}>
              <span className={styles.iconTitle}>
                <FiCalendar className={styles.animatedIcon} />
                <span>Select Date</span>
              </span>
            </h3>

            <div className={styles.calendarHeader}>
              <button onClick={prevMonth} className={styles.calendarNavBtn}>
                <FiChevronLeft />
              </button>

              <span>
                {monthName} {year}
              </span>

              <button onClick={nextMonth} className={styles.calendarNavBtn}>
                <FiChevronRight />
              </button>
            </div>

            <div className={styles.weekDays}>
              {daysOfWeek.map((day) => (
                <div key={day}>{day}</div>
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

                return (
                  <div
                    key={dayNumber}
                    className={`${styles.day} ${
                      isWeekend ? styles.weekend : ""
                    } ${
                      selectedDate === dayNumber && !isWeekend
                        ? styles.selectedDay
                        : ""
                    }`}
                    onClick={() => {
                      if (!isWeekend && requireDocument()) {
                        setSelectedDate(dayNumber);
                      }
                    }}
                  >
                    {dayNumber}
                  </div>
                );
              })}
            </div>
          </div>

          <div className={styles.timeSection}>
            <h3 className={styles.boxTitle}>
              <span className={styles.iconTitle}>
                <FiClock className={styles.animatedIcon} />
                <span>Select Time</span>
              </span>
            </h3>

            <div className={styles.timeSlots}>
              {timeSlots.map((slot) => (
                <button
                  key={slot}
                  className={`${styles.timeSlot} ${
                    selectedTime === slot ? styles.active : ""
                  }`}
                  onClick={() => {
                    if (requireDocument()) {
                      setSelectedTime(slot);
                    }
                  }}
                >
                  <span>{slot}</span>
                  {selectedTime === slot && <span>✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.legendSection}>
            <div className={styles.officeHours}>
              <h3 className={styles.officeTitle}>
                <span className={styles.iconTitle}>
                  <FiBriefcase className={styles.animatedIcon} />
                  <span>Office Hours</span>
                </span>
              </h3>

              <p>Monday – Friday</p>
              <p>8:00 AM – 5:00 PM</p>

              <p className={styles.officeNote}>
                Appointments outside office hours are unavailable.
              </p>
            </div>

            <div className={styles.legendGroup}>
              <h3 className={styles.legendTitle}>
                <span className={styles.iconTitle}>
                  <FiInfo className={styles.animatedIcon} />
                  <span>Legends</span>
                </span>
              </h3>

              <div className={styles.legend}>
                <p><span className={`${styles.dot} ${styles.available}`} />Available</p>
                <p><span className={`${styles.dot} ${styles.selected}`} />Selected</p>
                <p><span className={`${styles.dot} ${styles.booked}`} />Fully Booked</p>
                <p><span className={`${styles.dot} ${styles.unavailable}`} />Not Available</p>
              </div>
            </div>

            <div className={styles.actionButtons}>
              <button
                className={styles.cancelBtn}
                onClick={() => {
                  setSelectedDate(null);
                  setSelectedTime("");
                }}
              >
                Cancel
              </button>

              <button
                className={styles.confirmBtnLegend}
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      </div>

      {isClient &&
        showWarning &&
        createPortal(
          <div className={styles.overlay}>
            <div className={`${styles.modal} ${styles.warningModal}`}>
              <button
                className={styles.closeBtn}
                onClick={() => setShowWarning(false)}
              >
                ✕
              </button>

              <h3 className={styles.warningTitle}>
                <FiAlertTriangle />
                Action Required
              </h3>

              <p>{modalMessage}</p>

              <button
                className={styles.okBtn}
                onClick={() => {
                  setShowWarning(false);

                  if (modalReason === "DOCUMENT") {
                    router.push("/request-document");
                  }
                }}
              >
                OK
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
