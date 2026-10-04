"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";
import { DOCUMENTS, formatDate, normalizeStatus } from "../../lib/documents";
import { useAuth } from "./AuthProvider";
import styles from "./dashboard.module.css";
import VerificationBanner from "./VerificationBanner";
import NewsPreview from "./NewsPreview";
import {
  DocumentSpot,
  IconArrowRight,
  IconCalendar,
  IconCheckCircle,
  IconClipboard,
  IconClock,
  IconDocument,
  IconInbox,
  IconInfo,
  IconMegaphone,
  IconPlus,
  IconUsers,
  IconNewspaper,
  IconScale,
  SpotAppointment,
} from "./icons";

type Row = {
  id: string;
  user_id: string;
  full_name: string | null;
  document_type: string | null;
  other_document: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  status: string | null;
  created_at: string | null;
};

function greeting(hour: number) {
  if (hour < 12) return "Magandang umaga";
  if (hour < 18) return "Magandang hapon";
  return "Magandang gabi";
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function docLabel(r: Row) {
  return r.document_type === "Other Document Request" ? r.other_document || "Other Document" : r.document_type ?? "—";
}

export default function Dashboard() {
  const router = useRouter();
  const { user, role, displayName } = useAuth();
  const isAdmin = role === "admin";

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hour] = useState(() => new Date().getHours());
  const [pendingResidents, setPendingResidents] = useState<number | null>(null);
  const [openBlotters, setOpenBlotters] = useState<number | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    void supabase.rpc("kb_list_residents").then(({ data }) => {
      if (!active || !Array.isArray(data)) return;
      setPendingResidents(
        data.filter(
          (r: { verification_status: string; id_document_path: string | null }) =>
            r.verification_status === "pending" && !!r.id_document_path
        ).length
      );
    });
    void supabase
      .from("blotter_reports")
      .select("id", { count: "exact", head: true })
      .in("status", ["filed", "under_review", "scheduled"])
      .then(({ count, error }) => {
        if (active && !error) setOpenBlotters(count ?? 0);
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!user || role === null) return;
    let active = true;

    const load = async () => {
      let query = supabase.from("document_requests").select("*").order("created_at", { ascending: false });
      if (!isAdmin) query = query.eq("user_id", user.id);
      const { data, error } = await query;
      if (!active) return;
      if (error) setError(error.message);
      setRows((data ?? []) as Row[]);
      setLoading(false);
    };

    void load();

    const channel = supabase
      .channel(`dashboard-requests-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "document_requests",
          ...(isAdmin ? {} : { filter: `user_id=eq.${user.id}` }),
        },
        () => void load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [user, role, isAdmin]);

  const counts = useMemo(() => {
    const c = { total: rows.length, pending: 0, approved: 0, completed: 0, rejected: 0, cancelled: 0 };
    rows.forEach((r) => {
      const s = normalizeStatus(r.status) as keyof typeof c;
      if (s in c && s !== "total") c[s] += 1;
    });
    return c;
  }, [rows]);

  const today = todayIso();

  const upcoming = useMemo(
    () =>
      rows
        .filter((r) => ["pending", "approved"].includes(normalizeStatus(r.status)) && (r.appointment_date ?? "") >= today)
        .sort((a, b) => (a.appointment_date ?? "").localeCompare(b.appointment_date ?? "")),
    [rows, today]
  );

  const todaysSchedule = useMemo(() => upcoming.filter((r) => r.appointment_date === today), [upcoming, today]);

  const breakdown = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      const key = r.document_type ?? "Other Document Request";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [rows]);

  const username = typeof user?.user_metadata?.username === "string" ? user.user_metadata.username.trim() : "";
  const firstName = username || displayName.split(/\s+/)[0] || "Resident";

  const startRequest = (title: string) => {
    localStorage.setItem("documentRequest", JSON.stringify({ documentType: title }));
    router.push("/set-appointment");
  };

  const stats = isAdmin
    ? [
        { label: "Pending Review", value: counts.pending, icon: IconClock, tone: "warning", hint: "Awaiting action" },
        { label: "Approved", value: counts.approved, icon: IconCheckCircle, tone: "brand", hint: "Ready for pickup" },
        { label: "Completed", value: counts.completed, icon: IconClipboard, tone: "success", hint: "Released documents" },
        { label: "Today's Appointments", value: todaysSchedule.length, icon: IconCalendar, tone: "gold", hint: formatDate(today, { month: "long", day: "numeric" }) },
      ]
    : [
        { label: "Total Requests", value: counts.total, icon: IconDocument, tone: "brand", hint: "All time" },
        { label: "Pending", value: counts.pending, icon: IconClock, tone: "warning", hint: "Under review" },
        { label: "Approved", value: counts.approved, icon: IconCheckCircle, tone: "gold", hint: "Ready for pickup" },
        { label: "Completed", value: counts.completed, icon: IconClipboard, tone: "success", hint: "Claimed" },
      ];

  const recent = (isAdmin ? rows.filter((r) => normalizeStatus(r.status) === "pending") : rows).slice(0, 5);
  const manageHref = isAdmin ? "/admin/manage-services" : "/resident/manage-services";
  const maxBreakdown = Math.max(1, ...breakdown.map(([, n]) => n));
  const next = upcoming[0];

  return (
    <div className="kb-page">
      <VerificationBanner />

      <section className={styles.banner}>
        <div className={styles.bannerCopy}>
          <span className={styles.bannerTag}>{isAdmin ? "Barangay Admin Console" : "Resident Portal"}</span>
          <h1>
            {greeting(hour)}, {firstName}!
          </h1>
          <p>
            {isAdmin
              ? counts.pending > 0
                ? `You have ${counts.pending} request${counts.pending === 1 ? "" : "s"} waiting for review.`
                : "All caught up — no requests waiting for review."
              : "What barangay service do you need today? Request documents and track them all in one place."}
          </p>
          <div className={styles.bannerActions}>
            {isAdmin ? (
              <Link href="/admin/manage-services" className="kb-btn kb-btn-primary">
                <IconInbox size={18} /> Review Requests
              </Link>
            ) : (
              <>
                <Link href="/request-document" className="kb-btn kb-btn-primary">
                  <IconPlus size={18} /> New Request
                </Link>
                <Link href="/resident/manage-services" className="kb-btn kb-btn-secondary">
                  Track My Requests
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="kb-alert" style={{ marginBottom: 18 }}>
          <IconInfo size={18} /> {error}
        </div>
      )}

      <section className={styles.stats}>
        {stats.map(({ label, value, icon: Icon, tone, hint }) => (
          <article key={label} className={`${styles.stat} ${styles[`tone_${tone}`]}`}>
            <span className={styles.statIcon}>
              <Icon size={22} />
            </span>
            <div>
              <p className={styles.statLabel}>{label}</p>
              {loading ? (
                <span className={`kb-skeleton ${styles.statSkeleton}`} />
              ) : (
                <p className={styles.statValue}>{value}</p>
              )}
              <p className={styles.statHint}>{hint}</p>
            </div>
          </article>
        ))}
      </section>

      <div className={styles.grid}>
        <div className={styles.colMain}>
          {!isAdmin && (
            <section className="kb-card">
              <div className="kb-card-head">
                <h2>
                  <IconDocument size={18} /> Quick Services
                </h2>
                <Link href="/request-document" className={styles.headLink}>
                  View all <IconArrowRight size={16} />
                </Link>
              </div>
              <div className={styles.quickGrid}>
                {DOCUMENTS.slice(0, 6).map((doc) => (
                  <button key={doc.title} type="button" className={styles.quickItem} onClick={() => startRequest(doc.title)}>
                    <DocumentSpot type={doc.title} size={44} />
                    <span>{doc.title}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="kb-card">
            <div className="kb-card-head">
              <h2>
                {isAdmin ? <IconInbox size={18} /> : <IconClipboard size={18} />}
                {isAdmin ? "Needs Review" : "Recent Requests"}
              </h2>
              <Link href={manageHref} className={styles.headLink}>
                {isAdmin ? "Manage all" : "See all"} <IconArrowRight size={16} />
              </Link>
            </div>

            {loading ? (
              <div className={styles.listPad}>
                {[0, 1, 2].map((i) => (
                  <span key={i} className={`kb-skeleton ${styles.rowSkeleton}`} />
                ))}
              </div>
            ) : recent.length === 0 ? (
              <div className="kb-empty">
                <SpotAppointment size={72} />
                <h3>{isAdmin ? "No pending requests" : "No requests yet"}</h3>
                <p>
                  {isAdmin
                    ? "New resident requests will appear here as they come in."
                    : "Start by choosing a document — it only takes a minute."}
                </p>
                {!isAdmin && (
                  <Link href="/request-document" className="kb-btn kb-btn-primary kb-btn-sm">
                    Request a document
                  </Link>
                )}
              </div>
            ) : (
              <ul className={styles.reqList}>
                {recent.map((r) => {
                  const st = normalizeStatus(r.status);
                  return (
                    <li key={r.id}>
                      <Link
                        href={`/request-document/summary?id=${r.id}${isAdmin ? "&admin=1" : ""}`}
                        className={styles.reqRow}
                      >
                        <DocumentSpot type={r.document_type} size={40} />
                        <div className={styles.reqMain}>
                          <strong>{docLabel(r)}</strong>
                          <span>
                            {isAdmin && r.full_name ? `${r.full_name} · ` : ""}
                            {formatDate(r.appointment_date)} · {r.appointment_time ?? "—"}
                          </span>
                        </div>
                        <span className={`kb-status kb-status-${st}`}>{st}</span>
                        <IconArrowRight size={16} className={styles.reqArrow} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className={styles.colSide}>
          {isAdmin ? (
            <>
              <Link href="/admin/residents" className={`kb-card ${styles.residentsCard}`}>
                <span className={styles.residentsIcon}>
                  <IconUsers size={22} />
                </span>
                <div>
                  <strong>{pendingResidents ?? "—"}</strong>
                  <span>
                    {pendingResidents === 1 ? "ID" : "IDs"} waiting for verification
                  </span>
                </div>
                <IconArrowRight size={18} className={styles.reqArrow} />
              </Link>

              <Link href="/admin/blotter" className={`kb-card ${styles.residentsCard}`}>
                <span className={`${styles.residentsIcon} ${styles.blotterIcon}`}>
                  <IconScale size={22} />
                </span>
                <div>
                  <strong>{openBlotters ?? "—"}</strong>
                  <span>open blotter {openBlotters === 1 ? "report" : "reports"}</span>
                </div>
                <IconArrowRight size={18} className={styles.reqArrow} />
              </Link>

              <section className="kb-card">
                <div className="kb-card-head">
                  <h3>
                    <IconCalendar size={18} /> Today&apos;s Schedule
                  </h3>
                </div>
                {todaysSchedule.length === 0 ? (
                  <p className={styles.sideEmpty}>No appointments scheduled for today.</p>
                ) : (
                  <ul className={styles.timeline}>
                    {todaysSchedule.map((r) => (
                      <li key={r.id}>
                        <span className={styles.timelineTime}>{r.appointment_time}</span>
                        <div>
                          <strong>{r.full_name ?? "Resident"}</strong>
                          <span>{docLabel(r)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="kb-card">
                <div className="kb-card-head">
                  <h3>
                    <IconDocument size={18} /> Requests by Document
                  </h3>
                </div>
                {breakdown.length === 0 ? (
                  <p className={styles.sideEmpty}>No requests yet.</p>
                ) : (
                  <ul className={styles.bars}>
                    {breakdown.map(([type, n]) => (
                      <li key={type} title={`${type}: ${n} request${n === 1 ? "" : "s"}`}>
                        <div className={styles.barLabel}>
                          <span>{type}</span>
                          <strong>{n}</strong>
                        </div>
                        <div className={styles.barTrack}>
                          <span className={styles.barFill} style={{ width: `${(n / maxBreakdown) * 100}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          ) : (
            <section className={`kb-card ${styles.nextCard}`}>
              <div className="kb-card-head">
                <h3>
                  <IconCalendar size={18} /> Upcoming Appointment
                </h3>
              </div>
              {next ? (
                <div className={styles.nextBody}>
                  <div className={styles.dateTile}>
                    <span>{formatDate(next.appointment_date, { month: "short" })}</span>
                    <strong>{formatDate(next.appointment_date, { day: "numeric" })}</strong>
                    <small>{formatDate(next.appointment_date, { weekday: "short" })}</small>
                  </div>
                  <div className={styles.nextInfo}>
                    <strong>{docLabel(next)}</strong>
                    <span>
                      <IconClock size={14} /> {next.appointment_time}
                    </span>
                    <span className={`kb-status kb-status-${normalizeStatus(next.status)}`}>
                      {normalizeStatus(next.status)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={styles.sideEmpty}>No upcoming appointments. Book one when you request a document.</p>
              )}
            </section>
          )}

          {!isAdmin && (
            <section className="kb-card">
              <div className="kb-card-head">
                <h3>
                  <IconNewspaper size={18} /> Upcoming Event
                </h3>
                <Link href="/news" className={styles.headLink}>
                  View all <IconArrowRight size={16} />
                </Link>
              </div>
              <div className={styles.newsBody}>
                <NewsPreview limit={1} layout="list" upcomingEvents emptyText="No upcoming events right now." />
              </div>
            </section>
          )}

          <section className={`kb-card ${styles.notice}`}>
            <div className="kb-card-head">
              <h3>
                <IconMegaphone size={18} /> Paalala sa Residente
              </h3>
            </div>
            <ul className={styles.noticeList}>
              <li>
                <span className={styles.noticeDot} />
                <span>Bring a valid government ID when claiming your document.</span>
              </li>
              <li>
                <span className={styles.noticeDot} />
                <span>Arrive at least 10 minutes before your appointment time.</span>
              </li>
              <li>
                <span className={styles.noticeDot} />
                <span>
                  {isAdmin ? (
                    <>Residents can cancel pending requests themselves from My Requests.</>
                  ) : (
                    <>
                      Pending requests can be cancelled from <Link href={manageHref}>My Requests</Link>.
                    </>
                  )}
                </span>
              </li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
