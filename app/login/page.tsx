"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { FiMail, FiLock, FiEye, FiEyeOff } from "react-icons/fi";
import styles from "./login.module.css";
import supabase from "../../lib/supabaseClient";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!email) {
      setEmailError("Please enter your email");
      return;
    }

    if (!password) {
      setPasswordError("Please enter your password");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setGeneralError(error.message);
      return;
    }

    if (data.session) {
      const nextPath = searchParams.get("next");
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/");
    }
  };

  const handleForgotPassword = async () => {
    setEmailError("");
    setGeneralError("");

    if (!email) {
      setEmailError("Please input email first");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setGeneralError(error.message);
    } else {
      setGeneralError("Password reset email sent.");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrap}>
        <h1 className={styles.title}>
          <span>Welcome to</span>
          <Image
            src="/logo/logo.png"
            alt="KonektBarangay"
            width={200}
            height={60}
            priority
            className={styles.logoInline}
          />
        </h1>

        <p className={styles.subtitle}>
          &quot;Connecting you to your Barangay, one click at a time.&quot;
        </p>

        <div className={styles.card}>
          <div className={styles.field}>
            <label>Email</label>
            <div className={styles.inputWrapper}>
              <FiMail className={styles.icon} />
              <input
                type="email"
                placeholder="Enter your Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {emailError && <small className={styles.error}>{emailError}</small>}
          </div>

          <div className={styles.field}>
            <label>Password</label>
            <div className={styles.inputWrapper}>
              <FiLock className={styles.icon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {passwordError && (
              <small className={styles.error}>{passwordError}</small>
            )}
          </div>

          <button className={styles.forgot} onClick={handleForgotPassword}>
            Forgot Password?
          </button>

          {generalError && (
            <p className={styles.generalError}>{generalError}</p>
          )}

          <button
            className={styles.loginBtn}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "LOGIN"}
          </button>

          <p className={styles.signup}>
            Don&apos;t have an account?{" "}
            <span onClick={() => router.push("/register")}>Register Now</span>
          </p>
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
