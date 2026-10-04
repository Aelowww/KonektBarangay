"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import supabase from "../../lib/supabaseClient";
import {
  clearLoginFailures,
  friendlyAuthError,
  loginLockRemaining,
  recordLoginFailure,
  safeNextPath,
  setPendingEmail,
} from "../../lib/authHelpers";
import AuthAside from "../components/AuthAside";
import Captcha, { CAPTCHA_ENABLED, type CaptchaHandle } from "../components/Captcha";
import { useAuth } from "../components/AuthProvider";
import { IconAlert, IconClock, IconEye, IconEyeOff, IconLock, IconMail } from "../components/icons";

function LoginPageContent() {
  const router = useRouter();
  const { user, resolved } = useAuth();
  const captchaRef = useRef<CaptchaHandle>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lockSeconds, setLockSeconds] = useState(0);
  const [idleNotice, setIdleNotice] = useState(false);

  const getNextPath = () => safeNextPath(new URLSearchParams(window.location.search).get("next"));

  const submittingRef = useRef(false);

  useEffect(() => {
    if (resolved && user && !submittingRef.current) router.replace(safeNextPath(new URLSearchParams(window.location.search).get("next")));
  }, [resolved, user, router]);

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

  const handleLogin = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading || lockSeconds > 0) return;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");
    setNeedsVerification(false);

    const mail = email.trim().toLowerCase();

    if (!mail) {
      setEmailError("Please enter your email");
      return;
    }

    if (!password) {
      setPasswordError("Please enter your password");
      return;
    }

    if (CAPTCHA_ENABLED && !captchaToken) {
      setGeneralError("Please complete the human verification.");
      return;
    }

    setLoading(true);
    submittingRef.current = true;
    try {
      await submitLogin(mail);
    } finally {
      submittingRef.current = false;
    }
  };

  const submitLogin = async (mail: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: mail,
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });

    captchaRef.current?.reset();
    setLoading(false);

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setNeedsVerification(true);
        setGeneralError(friendlyAuthError(error.message));
        return;
      }

      const locked = recordLoginFailure();
      if (locked) {
        setLockSeconds(locked);
        setGeneralError(`Too many failed attempts. Please wait ${locked} seconds before trying again.`);
      } else {
        setGeneralError(friendlyAuthError(error.message));
      }
      return;
    }

    let needsIdUpload = false;

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, verification_status, id_document_path")
        .eq("id", data.user.id)
        .single();
      if ((profile?.role ?? "").toLowerCase() === "admin") {
        await supabase.auth.signOut();
        setGeneralError("This account can't sign in here.");
        return;
      }
      const status = (profile?.verification_status ?? "pending").toLowerCase();
      needsIdUpload = status === "rejected" || (status === "pending" && !profile?.id_document_path);
    }

    clearLoginFailures();

    if (data.session) {
      router.push(needsIdUpload ? "/verify-identity" : getNextPath());
    }
  };

  const goVerify = () => {
    setPendingEmail(email.trim().toLowerCase(), false);
    router.push("/verify-email");
  };

  const goReset = () => {
    if (email.trim()) setPendingEmail(email.trim().toLowerCase(), false);
    router.push("/reset-password");
  };

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <AuthAside
          title="Connecting you to your Barangay, one click at a time."
          text="Sign in to manage your document requests and appointments."
        />

        <div className={styles.formSide}>
          <span className={styles.logo}>
            <Image src="/logo/logo.png" alt="KonektBarangay" width={270} height={84} priority />
          </span>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Log in to your account to continue.</p>

          <form className={styles.form} onSubmit={handleLogin} noValidate>
            <div className="kb-field">
              <label className="kb-label" htmlFor="email">
                Email address
              </label>
              <div className="kb-input-wrap">
                <IconMail size={18} />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  maxLength={120}
                  className={`kb-input ${emailError ? "kb-input-error" : ""}`}
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {emailError && <small className="kb-error-text">{emailError}</small>}
            </div>

            <div className="kb-field">
              <label className="kb-label" htmlFor="password">
                Password
              </label>
              <div className="kb-input-wrap">
                <IconLock size={18} />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  maxLength={72}
                  className={`kb-input ${passwordError ? "kb-input-error" : ""}`}
                  placeholder="Enter password"
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
              {passwordError && <small className="kb-error-text">{passwordError}</small>}
            </div>

            <div className={styles.row}>
              <button type="button" className={styles.linkBtn} onClick={goReset}>
                Forgot password?
              </button>
            </div>

            <Captcha ref={captchaRef} onToken={setCaptchaToken} />

            {idleNotice && !generalError && (
              <div className="kb-alert kb-alert-info">
                <IconClock size={18} />
                <span>You were signed out after 30 minutes of inactivity. Please sign in again.</span>
              </div>
            )}

            {generalError && (
              <div className="kb-alert">
                <IconAlert size={18} />
                <span>
                  {generalError}{" "}
                  {needsVerification && (
                    <button type="button" className={styles.linkBtn} onClick={goVerify}>
                      Verify my email
                    </button>
                  )}
                </span>
              </div>
            )}

            <button
              type="submit"
              className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block"
              disabled={loading || lockSeconds > 0}
            >
              {loading ? "Logging in..." : lockSeconds > 0 ? `Try again in ${lockSeconds}s` : "Log in"}
            </button>

            <p className={styles.switch}>
              Don&apos;t have an account? <Link href="/register">Register now</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
