"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./manage-services.module.css";
import supabase from "../../lib/supabaseClient";

export default function ManageServicesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);

  useEffect(() => {
    const checkAndRedirect = async () => {
      setRouteError(null);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsLoggedIn(false);
        setLoading(false);
        return;
      }

      setIsLoggedIn(true);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile) {
        setRouteError(
          "Unable to verify your account role right now. Please try again or log out and sign in again."
        );
        setLoading(false);
        return;
      }

      const role = (profile.role ?? "").toLowerCase();

      if (role === "admin") {
        router.replace("/admin/manage-services");
      } else if (role === "resident") {
        router.replace("/resident/manage-services");
      } else {
        setRouteError("Your account role is not configured. Please contact the administrator.");
        setLoading(false);
      }
    };

    checkAndRedirect();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async () => {
      await checkAndRedirect();
    });

    return () => subscription.unsubscribe();
  }, [router, retryTick]);

  if (loading) {
    return (
      <main className={styles.loadingScreen} role="status" aria-live="polite">
        <div className={styles.loadingCard}>
          <div className={styles.loadingOrb} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <h2 className={styles.loadingTitle}>Preparing your dashboard</h2>
          <p className={styles.loadingSub}>Checking your account and routing your view...</p>
          <div className={styles.loadingBars} aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.lockWrapper}>
            <svg
              className={styles.lockIcon}
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M7 10V7a5 5 0 0 1 10 0v3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="2"
              />
              <circle cx="12" cy="15" r="1.5" fill="currentColor" />
            </svg>
          </div>

          <h1 className={styles.title}>Login Required</h1>

          <p className={styles.description}>
            Please log in to view your service request and access barangay
            services. This helps ensure proper permission and secure handling of
            service information.
          </p>

          <div className={styles.actions}>
            <Link href="/login" className={styles.loginBtn}>
              Log In
            </Link>

            <Link href="/" className={styles.secondaryBtn}>
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (routeError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>Unable to Open Manage Services</h1>
          <p className={styles.description}>{routeError}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.loginBtn}
              onClick={() => {
                setLoading(true);
                setRouteError(null);
                setRetryTick((v) => v + 1);
              }}
            >
              Retry
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
