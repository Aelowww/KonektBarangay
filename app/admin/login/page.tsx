"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import {
  clearLoginFailures,
  friendlyAuthError,
  loginLockRemaining,
  recordLoginFailure,
  safeNextPath,
} from "@/lib/authHelpers";
import styles from "../../login/login.module.css";
import Captcha, { CAPTCHA_ENABLED, type CaptchaHandle } from "@/app/components/Captcha";
import { IconAlert, IconClock, IconEye, IconEyeOff, IconLock, IconMail, IconShield } from "@/app/components/icons";

export default function AdminLoginPage() {
  const router = useRouter();
  const captchaRef = useRef<CaptchaHandle>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [idleNotice, setIdleNotice] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      setLockSeconds(loginLockRemaining());
      setIdleNotice(new URLSearchParams(window.location.search).get("reason") === "idle");
    });
  }, []);

  useEffect(() => {
    if (lockSeconds <= 0) return;
    const id = setTimeout(() => setLockSeconds(loginLockRemaining()), 1000);
    return () => clearTimeout(id);
  }, [lockSeconds]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || lockSeconds > 0) return;
    setError("");

    const mail = email.trim().toLowerCase();
    if (!mail || !password) {
      setError("Enter your staff email and password.");
      return;
    }
    if (CAPTCHA_ENABLED && !captchaToken) {
      setError("Please complete the human verification.");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: mail,
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });
    captchaRef.current?.reset();

    if (error || !data.user) {
      setLoading(false);
      const locked = recordLoginFailure();
      setError(
        locked
          ? `Too many failed attempts. Please wait ${locked} seconds before trying again.`
          : friendlyAuthError(error?.message)
      );
      if (locked) setLockSeconds(locked);
      return;
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();

    if ((profile?.role ?? "").toLowerCase() !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      recordLoginFailure();
      setError("This account is not authorized to use the staff portal.");
      return;
    }

    clearLoginFailures();
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    router.replace(next.startsWith("/admin") ? next : "/admin/manage-services");
  };

  return (
    <div className={styles.container}>
      <div className={`kb-card ${styles.staffCard}`}>
        <div className={styles.staffHead}>
          <span className={styles.staffSeal}>
            <Image src="/logo/logo-mark.png" alt="" width={36} height={36} />
          </span>
          <div>
            <strong>KonektBarangay</strong>
            <span>
              <IconShield size={13} /> Staff portal
            </span>
          </div>
        </div>

        <h1 className={styles.title}>Staff sign in</h1>
        <p className={styles.subtitle}>For authorized barangay personnel only.</p>

        <form className={styles.form} onSubmit={handleLogin} noValidate>
          <div className="kb-field">
            <label className="kb-label" htmlFor="staff-email">
              Email address
            </label>
            <div className="kb-input-wrap">
              <IconMail size={18} />
              <input
                id="staff-email"
                type="email"
                autoComplete="username"
                maxLength={120}
                className="kb-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="kb-field">
            <label className="kb-label" htmlFor="staff-password">
              Password
            </label>
            <div className="kb-input-wrap">
              <IconLock size={18} />
              <input
                id="staff-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                maxLength={72}
                className="kb-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: 48 }}
              />
              <button
                type="button"
                className="kb-icon-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
              </button>
            </div>
          </div>

          <Captcha ref={captchaRef} onToken={setCaptchaToken} />

          {idleNotice && !error && (
            <div className="kb-alert kb-alert-info">
              <IconClock size={18} />
              <span>You were signed out after 30 minutes of inactivity. Please sign in again.</span>
            </div>
          )}

          {error && (
            <div className="kb-alert">
              <IconAlert size={18} /> {error}
            </div>
          )}

          <button
            type="submit"
            className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block"
            disabled={loading || lockSeconds > 0}
          >
            {loading ? "Signing in..." : lockSeconds > 0 ? `Try again in ${lockSeconds}s` : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
