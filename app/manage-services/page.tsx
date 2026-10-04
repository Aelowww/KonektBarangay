"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./manage-services.module.css";
import supabase from "../../lib/supabaseClient";
import { IconAlert, IconLock } from "../components/icons";

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
      <main className="kb-loader" role="status" aria-live="polite">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
          <h2>Preparing your dashboard</h2>
          <p>Checking your account and routing your view...</p>
        </div>
      </main>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className={styles.page}>
        <div className={`kb-card ${styles.card}`}>
          <div className="kb-modal-icon">
            <IconLock size={30} />
          </div>
          <h1 className={styles.title}>Login required</h1>
          <p className={styles.description}>
            Please log in to view your service requests and access barangay services. This helps ensure proper
            permission and secure handling of service information.
          </p>
          <div className={styles.actions}>
            <Link href="/" className="kb-btn kb-btn-secondary">
              Back to Home
            </Link>
            <Link href="/login?next=/manage-services" className="kb-btn kb-btn-primary">
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (routeError) {
    return (
      <div className={styles.page}>
        <div className={`kb-card ${styles.card}`}>
          <div className="kb-modal-icon is-warning">
            <IconAlert size={30} />
          </div>
          <h1 className={styles.title}>Unable to open Manage Services</h1>
          <p className={styles.description}>{routeError}</p>
          <div className={styles.actions}>
            <button
              type="button"
              className="kb-btn kb-btn-secondary"
              onClick={async () => {
                await supabase.auth.signOut();
                router.replace("/login");
              }}
            >
              Log out
            </button>
            <button
              type="button"
              className="kb-btn kb-btn-primary"
              onClick={() => {
                setLoading(true);
                setRouteError(null);
                setRetryTick((v) => v + 1);
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
