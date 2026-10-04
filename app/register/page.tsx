"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";
import {
  USERNAME_PATTERN,
  friendlyAuthError,
  passwordChecks,
  setPendingEmail,
} from "../../lib/authHelpers";
import styles from "../login/login.module.css";
import AuthAside from "../components/AuthAside";
import Captcha, { CAPTCHA_ENABLED, type CaptchaHandle } from "../components/Captcha";
import { useAuth } from "../components/AuthProvider";
import {
  IconAlert,
  IconCheck,
  IconCheckCircle,
  IconClose,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconUser,
} from "../components/icons";

function RuleItem({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`${styles.ruleItem} ${ok ? styles.ruleOk : ""}`}>
      <span className={styles.ruleIcon}>{ok ? <IconCheck size={12} /> : <IconClose size={10} />}</span>
      <span>{text}</span>
    </li>
  );
}

type FieldErrors = Partial<Record<"username" | "email" | "password" | "confirmPassword" | "terms", string>>;

export default function Page() {
  const router = useRouter();
  const { user, resolved } = useAuth();
  const captchaRef = useRef<CaptchaHandle>(null);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [website, setWebsite] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (resolved && user) router.replace("/");
  }, [resolved, user, router]);

  const passwordRules = passwordChecks(password);
  const passedRules = Object.values(passwordRules).filter(Boolean).length;

  const handleRegister = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (loading) return;
    setGeneralError("");

    const handle = username.trim();
    const mail = email.trim().toLowerCase();
    const next: FieldErrors = {};

    if (!USERNAME_PATTERN.test(handle)) next.username = "3–20 letters, numbers, dots or underscores.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) next.email = "Enter a valid email address.";
    if (passedRules < 5) next.password = "Password does not meet all requirements.";
    if (!confirmPassword) next.confirmPassword = "Re-enter your password.";
    else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match.";
    if (!agreed) next.terms = "Please agree to the Terms of Service and Privacy Policy.";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (website) {
      setShowSuccessModal(true);
      return;
    }

    if (CAPTCHA_ENABLED && !captchaToken) {
      setGeneralError("Please complete the human verification.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: mail,
      password,
      options: {
        data: {
          username: handle,
          role: "resident",
        },
        captchaToken: captchaToken ?? undefined,
      },
    });

    captchaRef.current?.reset();

    if (error || !data.user) {
      setGeneralError(friendlyAuthError(error?.message || "Registration failed"));
      setLoading(false);
      return;
    }

    if (data.user.identities && data.user.identities.length === 0) {
      setGeneralError("An account with this email already exists. Log in, or verify it if you haven't yet.");
      setLoading(false);
      return;
    }

    setLoading(false);

    if (data.session) {
      await supabase.auth.signOut();
      setShowSuccessModal(true);
      return;
    }

    setPendingEmail(mail);
    router.push("/verify-email");
  };

  const fieldClass = (key: keyof FieldErrors) => `kb-input ${errors[key] ? "kb-input-error" : ""}`;

  return (
    <div className={styles.container}>
      <div className={styles.shell}>
        <AuthAside
          title="Create your resident account."
          text="Join your barangay online — requests, schedules, and updates in one place."
        />

        <div className={styles.formSide}>
          <span className={styles.logo}>
            <Image src="/logo/logo.png" alt="KonektBarangay" width={270} height={84} priority />
          </span>
          <h1 className={styles.title}>Register</h1>
          <p className={styles.subtitle}>Create your account to continue.</p>

          <form className={styles.form} onSubmit={handleRegister} noValidate>
            <div className={styles.grid2}>
              <div className="kb-field">
                <label className="kb-label" htmlFor="username">
                  Username
                </label>
                <div className="kb-input-wrap">
                  <IconUser size={18} />
                  <input
                    id="username"
                    autoComplete="username"
                    maxLength={20}
                    className={fieldClass("username")}
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                {errors.username && <small className="kb-error-text">{errors.username}</small>}
              </div>

              <div className="kb-field">
                <label className="kb-label" htmlFor="email">
                  Email
                </label>
                <div className="kb-input-wrap">
                  <IconMail size={18} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    maxLength={120}
                    className={fieldClass("email")}
                    placeholder="Enter email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                {errors.email && <small className="kb-error-text">{errors.email}</small>}
              </div>
            </div>

            <div className={styles.grid2}>
              <div className="kb-field">
                <label className="kb-label" htmlFor="password">
                  Password
                </label>
                <div className="kb-input-wrap">
                  <IconLock size={18} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    maxLength={72}
                    className={fieldClass("password")}
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
                {errors.password && <small className="kb-error-text">{errors.password}</small>}
              </div>

              <div className="kb-field">
                <label className="kb-label" htmlFor="confirm">
                  Re-enter password
                </label>
                <div className="kb-input-wrap">
                  <IconLock size={18} />
                  <input
                    id="confirm"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    maxLength={72}
                    className={fieldClass("confirmPassword")}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    className="kb-icon-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <small className="kb-error-text">{errors.confirmPassword}</small>}
              </div>
            </div>

            <div className={styles.rules}>
              <p>Password must include:</p>
              <ul>
                <RuleItem ok={passwordRules.length} text="At least 8 characters" />
                <RuleItem ok={passwordRules.upper} text="One uppercase letter" />
                <RuleItem ok={passwordRules.lower} text="One lowercase letter" />
                <RuleItem ok={passwordRules.number} text="One number" />
                <RuleItem ok={passwordRules.special} text="One symbol (@#$%^&*!?._-)" />
              </ul>
              <div className={styles.strength} aria-hidden="true">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className={i < passedRules ? styles.on : ""} />
                ))}
              </div>
            </div>

            <div aria-hidden="true" className={styles.honeypot}>
              <label htmlFor="website">Website</label>
              <input
                id="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <label className={styles.consent}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>
                I agree to the <Link href="/terms-of-service">Terms of Service</Link> and{" "}
                <Link href="/privacy-policy">Privacy Policy</Link>, and confirm the information I provide is true.
              </span>
            </label>
            {errors.terms && <small className="kb-error-text">{errors.terms}</small>}

            <Captcha ref={captchaRef} onToken={setCaptchaToken} />

            {generalError && (
              <div className="kb-alert">
                <IconAlert size={18} /> {generalError}
              </div>
            )}

            <button type="submit" className="kb-btn kb-btn-primary kb-btn-lg kb-btn-block" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
            </button>

            <p className={styles.switch}>
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </form>
        </div>
      </div>

      {showSuccessModal &&
        createPortal(
          <div className="kb-modal-overlay">
            <div className="kb-modal">
              <div className="kb-modal-icon is-success">
                <IconCheckCircle size={32} />
              </div>
              <h3>Registration Successful!</h3>
              <p>Your account has been created successfully. Please continue to login.</p>
              <div className="kb-modal-actions">
                <button className="kb-btn kb-btn-primary" onClick={() => router.push("/login")}>
                  Continue
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
