"use client";

import { startTransition, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaBell } from "react-icons/fa";
import supabase from "../../lib/supabaseClient";
import "./header.css";

const HomeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 10.5L12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
  </svg>
);

const DocumentIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2z" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8.5a3.5 3.5 0 1 0 0 7a3.5 3.5 0 0 0 0-7Zm9.4 3.5c0-.34-.03-.67-.08-1l2.1-1.6-2-3.4-2.5 1a8 8 0 0 0-1.7-1l-.4-2.6h-4l-.4 2.6a8 8 0 0 0-1.7 1l-2.5-1-2 3.4 2.1 1.6a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.4 2.5-1a8 8 0 0 0 1.7 1l.4 2.6h4l.4-2.6a8 8 0 0 0 1.7-1l2.5 1 2-3.4-2.1-1.6c.05-.33.08-.66.08-1Z" />
  </svg>
);

const TermsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V4Zm4 3h8v2H8V7Zm0 4h8v2H8v-2Z" />
  </svg>
);

const PrivacyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2 4 5v6c0 5.25 3.4 10.74 8 12 4.6-1.26 8-6.75 8-12V5l-8-3Zm0 3.2 5 1.88V11c0 4.1-2.42 8.4-5 9.74C9.42 19.4 7 15.1 7 11V7.08L12 5.2Zm-1 4.8a3 3 0 1 1 2 2.83V15h-2v-2.17A3 3 0 0 1 11 10Z" />
  </svg>
);

export default function Header({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async (currentUserId: string) => {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("is_read", false);

    if (error) {
      console.error(error);
      setUnreadCount(0);
      return;
    }

    setUnreadCount(count ?? 0);
  }, []);

  const syncAuthState = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    startTransition(() => {
      if (userError || !user) {
        setIsLoggedIn(false);
        setUserId(null);
        setUnreadCount(0);
        setOpen(false);
        setAuthResolved(true);
        return;
      }

      setIsLoggedIn(true);
      setUserId(user.id);
      setAuthResolved(true);
    });

    if (!userError && user) {
      void refreshUnreadCount(user.id);
    }
  }, [refreshUnreadCount, setOpen]);

  useEffect(() => {
    queueMicrotask(() => {
      void syncAuthState();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncAuthState();
    });

    return () => subscription.unsubscribe();
  }, [syncAuthState]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-header-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      }, () => {
        void refreshUnreadCount(userId);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshUnreadCount, userId]);

  useEffect(() => {
    if (!userId) return;

    const syncUnread = () => {
      if (document.visibilityState !== "visible") return;
      void refreshUnreadCount(userId);
    };

    window.addEventListener("focus", syncUnread);
    document.addEventListener("visibilitychange", syncUnread);

    return () => {
      window.removeEventListener("focus", syncUnread);
      document.removeEventListener("visibilitychange", syncUnread);
    };
  }, [refreshUnreadCount, userId]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <header className={`site-header ${!isLoggedIn ? "logged-out" : ""}`}>
      <div className="header-inner">
        <Link
          href="/"
          className="brand-logo-link"
          onClick={() => {
            setOpen(false);
          }}
        >
          <div className="logo-wrapper">
            <Image
              src="/logo/logo.png"
              alt="KonektBarangay"
              width={270}
              height={84}
              priority
              className="nav-logo"
            />
          </div>
        </Link>

        <nav className="nav-pill">
          {isLoggedIn && (
            <button
              className="menu-btn"
              onClick={() => {
                setOpen(!open);
              }}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}

          <div className="nav-links">
            {isLoggedIn ? (
              <>
                <Link href="/">Home</Link>
                <Link href="/request-document">Request Document</Link>
                <Link href="/set-appointment">Set Appointment</Link>
                <Link href="/manage-services">Manage Services</Link>
              </>
            ) : (
              <>
                <Link href="/">Home</Link>
                <Link href="/request-document">Barangay Services</Link>
                <Link href="/manage-services">Manage Services</Link>
                <Link href="/terms-of-service">Terms of Service</Link>
                <Link href="/privacy-policy">Privacy Policy</Link>
              </>
            )}
          </div>
        </nav>

        <div className="auth-buttons">
          {!authResolved ? null : isLoggedIn ? (
            <>
              <Link
                href="/notifications"
                className="notification-btn"
                aria-label="Notifications"
              >
                <span className="notification-icon">
                  <FaBell />
                </span>
                {unreadCount > 0 ? <span className="notification-badge">{unreadCount}</span> : null}
              </Link>

              <button onClick={logout} className="logout-btn">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="login-btn">
                Login
              </Link>
              <Link href="/register" className="cta-btn">
                Register
              </Link>
            </>
          )}
        </div>
      </div>

      {isLoggedIn && (
        <div className={`mobile-menu ${open ? "open" : ""}`}>
          <Link href="/" onClick={() => setOpen(false)}>
            <HomeIcon />
            <span>Home</span>
          </Link>

          <Link href="/request-document" onClick={() => setOpen(false)}>
            <DocumentIcon />
            <span>Request Document</span>
          </Link>

          <Link href="/set-appointment" onClick={() => setOpen(false)}>
            <CalendarIcon />
            <span>Set Appointment</span>
          </Link>

          <Link href="/manage-services" onClick={() => setOpen(false)}>
            <SettingsIcon />
            <span>Manage Services</span>
          </Link>

          <Link href="/terms-of-service" onClick={() => setOpen(false)}>
            <TermsIcon />
            <span>Terms of Service</span>
          </Link>

          <Link href="/privacy-policy" onClick={() => setOpen(false)}>
            <PrivacyIcon />
            <span>Privacy Policy</span>
          </Link>
        </div>
      )}
    </header>
  );
}
