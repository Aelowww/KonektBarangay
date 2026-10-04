"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";
import {
  RESEND_COOLDOWN_SECONDS,
  clearPendingEmail,
  friendlyAuthError,
  getPendingEmail,
  passwordChecks,
} from "../../lib/authHelpers";
import styles from "../login/login.module.css";
import AuthAside from "../components/AuthAside";
import Captcha, { CAPTCHA_ENABLED, type CaptchaHandle } from "../components/Captcha";
import {
  IconAlert,
  IconArrowLeft,
  IconCheckCircle,
  IconEye,
  IconEyeOff,
  IconInfo,
  IconLock,
  IconMail,
} from "../components/icons";

type Step = "request" | "code" | "new" | "done";

export default function ResetPasswordPage() {
  const router = useRouter();
  const captchaRef = useRef<CaptchaHandle>(null);

  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      const pending = getPendingEmail();
      if (pending) setEmail(pending);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStep("new");
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || cooldown > 0) return;
    setError("");
    setInfo("");

    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (CAPTCHA_ENABLED && !captchaToken) {
      setError("Please complete the human verification first.");
      return;
    }

    setBusy(true);
    const { data: registered, error: lookupError } = await supabase.rpc("kb_email_registered", { p_email: mail });
    if (!lookupError && registered === false) {
      setBusy(false);
      setError("No KonektBarangay account uses this email. Check the spelling or create an account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(mail, {
      redirectTo: `${window.location.origin}/reset-password`,
      captchaToken: captchaToken ?? undefined,
    });
    captchaRef.current?.reset();
    setBusy(false);

    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }

    setCooldown(RESEND_COOLDOWN_SECONDS);
    setInfo(`We sent a 6-digit code and a reset link to ${mail}.`);
    setStep("code");
  };

  const verifyCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setError("");
    setInfo("");

    const token = code.replace(/\D/g, "");
    if (token.length < 6) {
      setError("Enter the code from your email.");
      return;
    }

    setBusy(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: "recovery",
    });
    setBusy(false);

    if (error || !data.session) {
      setError(friendlyAuthError(error?.message || "Verification failed"));
      return;
    }

    setStep("new");
  };

  const rules = passwordChecks(password);
  const passed = Object.values(rules).filter(Boolean).length;

  const savePassword = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    setError("");

    if (passed < 5) {
      setError("Use at least 8 characters with uppercase, lowercase, a number, and a symbol.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setBusy(false);
      setError(friendlyAuthError(error.message));
      return;
    }

    await supabase.auth.signOut({ scope: "global" });
    clearPendingEmail();
    setBusy(false);
    setStep("done");
  };

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <AuthAside title="Reset your password." text="We'll verify it's really you before letting you choose a new one." />

        <div className={styles.formSide}>
          {step === "request" && (
            <>
              <h1 className={styles.title}>Forgot password</h1>
              <p className={styles.subtitle}>Enter your account email and we&apos;ll send you a reset code.</p>
              <form className={styles.form} onSubmit={sendCode} noValidate>
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
                      className="kb-input"
                      placeholder="Enter email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Captcha ref={captchaRef} onToken={setCaptchaToken} />
                {error && (
                  <div className="kb-alert">
                    <IconAlert size={18} /> {error}
                  </div>
                )}
                <button type="submit" className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block" disabled={busy}>
                  {busy ? "Sending..." : "Send reset code"}
                </button>
              </form>
            </>
          )}

          {step === "code" && (
            <>
              <h1 className={styles.title}>Enter reset code</h1>
              <p className={styles.subtitle}>
                Code sent to <span className={styles.otpEmail}>{email}</span>. You can also just open the link in the
                email.
              </p>
              <form className={styles.form} onSubmit={verifyCode} noValidate>
                <input
                  className={`kb-input ${styles.otpInput}`}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={10}
                  placeholder="••••••"
                  aria-label="Reset code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  autoFocus
                />
                {info && (
                  <div className="kb-alert kb-alert-info">
                    <IconInfo size={18} /> {info}
                  </div>
                )}
                {error && (
                  <div className="kb-alert">
                    <IconAlert size={18} /> {error}
                  </div>
                )}
                <button type="submit" className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block" disabled={busy}>
                  {busy ? "Verifying..." : "Verify code"}
                </button>
                <div className={styles.resendRow}>
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => {
                      setStep("request");
                      setError("");
                      setInfo("");
                    }}
                    disabled={cooldown > 0}
                    style={cooldown > 0 ? { color: "var(--text-3)", cursor: "default" } : undefined}
                  >
                    {cooldown > 0 ? `Request a new code in ${cooldown}s` : "Request a new code"}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === "new" && (
            <>
              <h1 className={styles.title}>Choose a new password</h1>
              <p className={styles.subtitle}>You&apos;ll be signed out of all devices after saving.</p>
              <form className={styles.form} onSubmit={savePassword} noValidate>
                <div className="kb-field">
                  <label className="kb-label" htmlFor="newPassword">
                    New password
                  </label>
                  <div className="kb-input-wrap">
                    <IconLock size={18} />
                    <input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
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
                  <div className={styles.strength} aria-hidden="true">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <span key={i} className={i < passed ? styles.on : ""} />
                    ))}
                  </div>
                </div>
                <div className="kb-field">
                  <label className="kb-label" htmlFor="confirmNew">
                    Confirm new password
                  </label>
                  <div className="kb-input-wrap">
                    <IconLock size={18} />
                    <input
                      id="confirmNew"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      maxLength={72}
                      className="kb-input"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                    />
                  </div>
                </div>
                {error && (
                  <div className="kb-alert">
                    <IconAlert size={18} /> {error}
                  </div>
                )}
                <button type="submit" className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block" disabled={busy}>
                  {busy ? "Saving..." : "Save new password"}
                </button>
              </form>
            </>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", paddingTop: 30 }}>
              <div className="kb-modal-icon is-success">
                <IconCheckCircle size={32} />
              </div>
              <h1 className={styles.title}>Password updated</h1>
              <p className={styles.subtitle}>Log in with your new password.</p>
              <button className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block" onClick={() => router.replace("/login")}>
                Go to login
              </button>
            </div>
          )}

          {step !== "done" && (
            <p className={styles.switch} style={{ marginTop: 18 }}>
              <Link href="/login">
                <IconArrowLeft size={14} /> Back to login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
