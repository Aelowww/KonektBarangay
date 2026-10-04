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
  pendingCodeWasSent,
  setPendingEmail,
} from "../../lib/authHelpers";
import styles from "../login/login.module.css";
import AuthAside from "../components/AuthAside";
import Captcha, { CAPTCHA_ENABLED, type CaptchaHandle } from "../components/Captcha";
import { IconAlert, IconArrowLeft, IconInfo, IconMail, SpotNotification } from "../components/icons";

export default function VerifyEmailPage() {
  const router = useRouter();
  const captchaRef = useRef<CaptchaHandle>(null);

  const [email, setEmail] = useState("");
  const [knownEmail, setKnownEmail] = useState(false);
  const [code, setCode] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      const pending = getPendingEmail();
      if (pending) {
        setEmail(pending);
        setKnownEmail(true);
        if (pendingCodeWasSent()) setCooldown(RESEND_COOLDOWN_SECONDS);
      }
    });
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (verifying) return;
    setError("");
    setInfo("");

    const mail = email.trim().toLowerCase();
    const token = code.replace(/\D/g, "");

    if (!mail) {
      setError("Enter the email you registered with.");
      return;
    }
    if (token.length < 6) {
      setError("Enter the code from your email.");
      return;
    }

    setVerifying(true);
    const { data, error } = await supabase.auth.verifyOtp({ email: mail, token, type: "email" });
    setVerifying(false);

    if (error || !data.session) {
      setError(friendlyAuthError(error?.message || "Verification failed"));
      return;
    }

    clearPendingEmail();
    router.replace("/verify-identity");
  };

  const handleResend = async () => {
    if (resending || cooldown > 0) return;
    setError("");
    setInfo("");

    const mail = email.trim().toLowerCase();
    if (!mail) {
      setError("Enter the email you registered with.");
      return;
    }
    if (CAPTCHA_ENABLED && !captchaToken) {
      setError("Please complete the human verification first.");
      return;
    }

    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: mail,
      options: { captchaToken: captchaToken ?? undefined },
    });
    captchaRef.current?.reset();
    setResending(false);

    if (error) {
      setError(friendlyAuthError(error.message));
      return;
    }

    setPendingEmail(mail);
    setKnownEmail(true);
    setCooldown(RESEND_COOLDOWN_SECONDS);
    setInfo("A new code is on its way. Check your inbox and spam folder.");
  };

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <AuthAside
          title="One last step — verify your email."
          text="This keeps fake and spam accounts out of your barangay's portal."
        />

        <div className={styles.formSide}>
          <SpotNotification size={64} />
          <h1 className={styles.title} style={{ marginTop: 14 }}>
            Check your email
          </h1>
          <p className={styles.subtitle}>
            {knownEmail ? (
              <>
                We sent a verification code to <span className={styles.otpEmail}>{email}</span>. Enter it below to
                activate your account.
              </>
            ) : (
              "Enter your email and the verification code we sent you."
            )}
          </p>

          <form className={styles.form} onSubmit={handleVerify} noValidate>
            {!knownEmail && (
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
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="kb-field">
              <label className="kb-label" htmlFor="code">
                Verification code
              </label>
              <input
                id="code"
                className={`kb-input ${styles.otpInput}`}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={10}
                placeholder="••••••"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
              />
            </div>

            {error && (
              <div className="kb-alert">
                <IconAlert size={18} /> {error}
              </div>
            )}
            {info && (
              <div className="kb-alert kb-alert-info">
                <IconInfo size={18} /> {info}
              </div>
            )}

            <button type="submit" className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block" disabled={verifying}>
              {verifying ? "Verifying..." : "Verify & continue"}
            </button>

            <Captcha ref={captchaRef} onToken={setCaptchaToken} />

            <div className={styles.resendRow}>
              Didn&apos;t get it?
              <button
                type="button"
                className={styles.linkBtn}
                onClick={handleResend}
                disabled={resending || cooldown > 0}
                style={cooldown > 0 ? { color: "var(--text-3)", cursor: "default" } : undefined}
              >
                {resending ? "Sending..." : cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>

            {knownEmail && (
              <button
                type="button"
                className={styles.linkBtn}
                style={{ alignSelf: "center" }}
                onClick={() => {
                  setKnownEmail(false);
                  setCooldown(0);
                }}
              >
                Use a different email
              </button>
            )}

            <p className={styles.switch}>
              <Link href="/login">
                <IconArrowLeft size={14} /> Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
