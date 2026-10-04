"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import {
  IconBell,
  IconCalendar,
  IconChevronRight,
  IconClipboard,
  IconClock,
  IconDashboard,
  IconDocument,
  IconInbox,
  IconUsers,
  IconNewspaper,
  IconScale,
  IconLogout,
  IconMenu,
  IconScroll,
  IconShield,
} from "./icons";

type NavItem = {
  href: string;
  label: string;
  icon: (p: { size?: number }) => React.ReactElement;
  match?: (path: string) => boolean;
  badge?: number;
};

const PAGE_TITLES: { test: (p: string) => boolean; title: string; crumb: string }[] = [
  { test: (p) => p === "/", title: "Dashboard", crumb: "Overview" },
  { test: (p) => p.startsWith("/request-document/summary"), title: "Request Summary", crumb: "Services" },
  { test: (p) => p.startsWith("/request-document"), title: "Request a Document", crumb: "Services" },
  { test: (p) => p.startsWith("/set-appointment"), title: "Set Appointment", crumb: "Services" },
  { test: (p) => p.startsWith("/admin/residents"), title: "Residents", crumb: "Administration" },
  { test: (p) => p.startsWith("/admin/blotter"), title: "Blotter Reports", crumb: "Administration" },
  { test: (p) => p.startsWith("/admin/news"), title: "News & Events", crumb: "Administration" },
  { test: (p) => p.startsWith("/admin"), title: "Manage Requests", crumb: "Administration" },
  { test: (p) => p.includes("manage-services"), title: "My Requests", crumb: "Services" },
  { test: (p) => p.startsWith("/blotter"), title: "Blotter Reports", crumb: "Services" },
  { test: (p) => p.startsWith("/news"), title: "News & Events", crumb: "Barangay Updates" },
  { test: (p) => p.startsWith("/verify-identity"), title: "Verify Identity", crumb: "Account" },
  { test: (p) => p.startsWith("/notifications"), title: "Notifications", crumb: "Inbox" },
  { test: (p) => p.startsWith("/terms-of-service"), title: "Terms of Service", crumb: "Information" },
  { test: (p) => p.startsWith("/privacy-policy"), title: "Privacy Policy", crumb: "Information" },
];

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function officeStatus(now: Date) {
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  return day >= 1 && day <= 5 && hour >= 8 && hour < 17;
}

function LogoMark({ size }: { size: number }) {
  return <Image src="/logo/logo-mark.png" alt="" width={size} height={size} priority />;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { displayName, role, unreadCount, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menu, setMenu] = useState<"user" | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const [viewingRecord, setViewingRecord] = useState(false);
  useEffect(() => {
    queueMicrotask(() => {
      setViewingRecord(new URLSearchParams(window.location.search).has("id"));
      setMenu(null);
    });
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const isAdmin = role === "admin";

  const mainNav: NavItem[] = [
    { href: "/", label: "Dashboard", icon: IconDashboard, match: (p) => p === "/" },
    isAdmin
      ? {
          href: "/admin/manage-services",
          label: "Manage Requests",
          icon: IconInbox,
          match: (p) => p.startsWith("/admin/manage-services"),
        }
      : {
          href: "/resident/manage-services",
          label: "My Requests",
          icon: IconClipboard,
          match: (p) => p.includes("manage-services"),
        },
    ...(isAdmin
      ? [
          { href: "/admin/blotter", label: "Blotter Reports", icon: IconScale },
          { href: "/admin/residents", label: "Residents", icon: IconUsers },
          { href: "/admin/news", label: "News & Events", icon: IconNewspaper },
        ]
      : [{ href: "/news", label: "News & Events", icon: IconNewspaper }]),
    { href: "/notifications", label: "Notifications", icon: IconBell, badge: unreadCount },
  ];

  const serviceNav: NavItem[] = [
    {
      href: "/request-document",
      label: "Request Document",
      icon: IconDocument,
      match: (p) => p.startsWith("/request-document"),
    },
    { href: "/set-appointment", label: "Set Appointment", icon: IconCalendar },
    { href: "/blotter", label: "Blotter Report", icon: IconScale },
  ];

  const infoNav: NavItem[] = [
    { href: "/terms-of-service", label: "Terms of Service", icon: IconScroll },
    { href: "/privacy-policy", label: "Privacy Policy", icon: IconShield },
  ];

  const isRecordView = viewingRecord && pathname.startsWith("/request-document/summary");
  const navPath = isRecordView ? (isAdmin ? "/admin/manage-services" : "/resident/manage-services") : pathname;
  const page = isRecordView
    ? { title: "Request Details", crumb: isAdmin ? "Administration" : "Services" }
    : PAGE_TITLES.find((p) => p.test(pathname)) ?? { title: "KonektBarangay", crumb: "Portal" };
  const isOpen = now ? officeStatus(now) : false;
  const showServices = Boolean(role) && !isAdmin;

  const isActive = (item: NavItem) => (item.match ? item.match(navPath) : navPath.startsWith(item.href));

  const renderLink = (item: NavItem) => {
    const active = isActive(item);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`kb-nav-link ${active ? "is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => setDrawerOpen(false)}
      >
        <Icon size={20} />
        <span>{item.label}</span>
        {item.badge ? <span className="kb-nav-badge">{item.badge > 99 ? "99+" : item.badge}</span> : null}
      </Link>
    );
  };

  const topLinks = showServices
    ? [mainNav[0], serviceNav[0], serviceNav[2], ...mainNav.slice(1, 3)]
    : mainNav.filter((item) => item.href !== "/notifications");
  const renderTopLink = (item: NavItem) => {
    const active = isActive(item);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`kb-topnav-link ${active ? "is-active" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        {item.label}
      </Link>
    );
  };

  const renderMenuItem = (item: NavItem) => {
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} className="kb-menu-item">
        <span className="kb-menu-icon">
          <Icon size={18} />
        </span>
        {item.label}
      </Link>
    );
  };

  const bell = (
    <Link
      href="/notifications"
      className={`kb-bell ${pathname.startsWith("/notifications") ? "is-active" : ""}`}
      aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
    >
      <IconBell size={20} />
      {unreadCount > 0 && <span className="kb-bell-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>
  );

  return (
    <div className={`kb-app ${drawerOpen ? "is-drawer-open" : ""}`}>
      <header className="kb-topnav" ref={navRef}>
        <div className="kb-topnav-inner">
          <Link href="/" className="kb-topnav-brand" aria-label="KonektBarangay home">
            <span className="kb-brand-mark">
              <LogoMark size={34} />
            </span>
            <span>
              <strong>KonektBarangay</strong>
              <small>E-Services Portal</small>
            </span>
          </Link>

          <nav className="kb-topnav-links" aria-label="Main navigation">
            {topLinks.map(renderTopLink)}
          </nav>

          <div className="kb-topnav-right">
            {bell}
            <div className="kb-topnav-drop">
              <button
                type="button"
                className="kb-user-btn"
                aria-expanded={menu === "user"}
                aria-haspopup="true"
                onClick={() => setMenu(menu === "user" ? null : "user")}
              >
                <span className="kb-avatar">{initials(displayName)}</span>
                <span className="kb-user-btn-text">
                  <strong>{displayName}</strong>
                  <span>{isAdmin ? "Barangay Admin" : "Resident"}</span>
                </span>
                <IconChevronRight size={15} className="kb-caret" />
              </button>
              {menu === "user" && (
                <div className="kb-menu kb-menu-right">
                  {infoNav.map(renderMenuItem)}
                  <div className="kb-menu-sep" />
                  <button type="button" className="kb-menu-item is-danger" onClick={logout}>
                    <span className="kb-menu-icon">
                      <IconLogout size={18} />
                    </span>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="kb-subbar">
          <div className="kb-subbar-inner">
            <span className="kb-crumb">
              {page.crumb}
              <IconChevronRight size={13} />
              <strong>{page.title}</strong>
            </span>
            <span className="kb-subbar-meta">
              <span>
                <IconClock size={15} /> Barangay Hall · Mon–Fri, 8:00 AM–5:00 PM
              </span>
              {now && (
                <>
                  <span className={`kb-open-dot ${isOpen ? "is-open" : "is-closed"}`}>
                    {isOpen ? "Open now" : "Closed now"}
                  </span>
                  <span>
                    <IconCalendar size={15} />
                    {now.toLocaleDateString("en-PH", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </>
              )}
            </span>
          </div>
        </div>
      </header>

      <aside className="kb-sidebar" aria-label="Main navigation">
        <Link href="/" className="kb-sidebar-brand" onClick={() => setDrawerOpen(false)}>
          <span className="kb-brand-mark">
            <LogoMark size={34} />
          </span>
          <span>
            <strong>KonektBarangay</strong>
            <small>E-Services Portal</small>
          </span>
        </Link>

        <nav className="kb-sidebar-nav">
          <p className="kb-nav-label">Main</p>
          {mainNav.map(renderLink)}
          {showServices && (
            <>
              <p className="kb-nav-label">Barangay Services</p>
              {serviceNav.map(renderLink)}
            </>
          )}
          <p className="kb-nav-label">Information</p>
          {infoNav.map(renderLink)}
        </nav>

        <div className="kb-sidebar-hours">
          <strong>
            <IconClock size={16} /> Barangay Hall Hours
          </strong>
          <p>Monday – Friday · 8:00 AM – 5:00 PM</p>
          {now && (
            <span className={`kb-open-dot ${isOpen ? "is-open" : "is-closed"}`}>
              {isOpen ? "Open now" : "Closed now"}
            </span>
          )}
        </div>

        <div className="kb-sidebar-user">
          <span className="kb-avatar">{initials(displayName)}</span>
          <div className="kb-sidebar-user-info">
            <strong>{displayName}</strong>
            <span>{isAdmin ? "Barangay Admin" : "Resident"}</span>
          </div>
          <button type="button" className="kb-logout-btn" onClick={logout} aria-label="Log out" title="Log out">
            <IconLogout size={18} />
          </button>
        </div>
      </aside>

      <div className="kb-drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-hidden="true" />

      <div className="kb-main">
        <header className="kb-topbar">
          <button
            type="button"
            className="kb-topbar-menu"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <IconMenu size={20} />
          </button>

          <div className="kb-topbar-title">
            <small>{page.crumb}</small>
            <strong>{page.title}</strong>
          </div>

          <div className="kb-topbar-right">{bell}</div>
        </header>

        <main className="kb-content">{children}</main>
      </div>
    </div>
  );
}
