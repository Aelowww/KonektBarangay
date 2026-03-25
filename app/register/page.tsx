"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  FiUser,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiX,
  FiCheck,
} from "react-icons/fi";
import supabase from "../../lib/supabaseClient";
import styles from "./register.module.css";

type RuleItemProps = {
  ok: boolean;
  text: string;
};

function RuleItem({ ok, text }: RuleItemProps) {
  return (
    <li className={styles.ruleItem}>
      {ok ? (
        <FiCheck className={styles.okIcon} />
      ) : (
        <FiX className={styles.xIcon} />
      )}
      <span className={ok ? styles.okText : ""}>{text}</span>
    </li>
  );
}

export default function Page() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ ADDED: success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@#$%^&*]/.test(password),
  };

  const hasError = (field: string) => errors.includes(field);

  const handleRegister = async () => {
    const newErrors: string[] = [];
    setGeneralError("");

    if (!username) newErrors.push("username");
    if (!email || !email.includes("@")) newErrors.push("email");
    if (!password) newErrors.push("password");
    if (!confirmPassword) newErrors.push("confirmPassword");

    if (password !== confirmPassword) {
      newErrors.push("password", "confirmPassword");
      setGeneralError("Passwords do not match");
    }

    if (
      !passwordRules.length ||
      !passwordRules.upper ||
      !passwordRules.lower ||
      !passwordRules.number ||
      !passwordRules.special
    ) {
      newErrors.push("password");
      setGeneralError("Password does not meet requirements");
    }

    setErrors(newErrors);

    if (newErrors.length > 0) {
      if (!generalError) setGeneralError("All fields are required.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: username,
          role: "resident",
        },
      },
    });

    if (error || !data.user) {
      setGeneralError(error?.message || "Registration failed");
      setLoading(false);
      return;
    }

    if (data.session) {
      await supabase.auth.signOut();
    }

    setLoading(false);
    setShowSuccessModal(true);
  };

  return (
    <div className={styles.container}>

      {showSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>Registration Successful!</h2>
            <p>
              Your account has been created successfully.
              <br />
              Please continue to login.
            </p>

            <button
              className={styles.modalBtn}
              onClick={() => router.push("/login")}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      <div>
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
            <label>Username</label>
            <div
              className={`${styles.inputWrapper} ${
                hasError("username") ? styles.errorBorder : ""
              }`}
            >
              <FiUser className={styles.icon} />
              <input
                placeholder="Type your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <div
              className={`${styles.inputWrapper} ${
                hasError("email") ? styles.errorBorder : ""
              }`}
            >
              <FiMail className={styles.icon} />
              <input
                placeholder="Type your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.field}>
            <label>Password</label>
            <div
              className={`${styles.inputWrapper} ${
                hasError("password") ? styles.errorBorder : ""
              }`}
            >
              <FiLock className={styles.icon} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
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
          </div>

          <div className={styles.field}>
            <label>Re-enter Password</label>
            <div
              className={`${styles.inputWrapper} ${
                hasError("confirmPassword") ? styles.errorBorder : ""
              }`}
            >
              <FiLock className={styles.icon} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className={styles.eye}
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className={styles.rules}>
            <p>Password must include:</p>
            <ul>
              <RuleItem ok={passwordRules.length} text="At least 8 characters" />
              <RuleItem ok={passwordRules.upper} text="One uppercase letter" />
              <RuleItem ok={passwordRules.lower} text="One lowercase letter" />
              <RuleItem ok={passwordRules.number} text="One number" />
              <RuleItem
                ok={passwordRules.special}
                text="One special character (@#$%^&*)"
              />
            </ul>
          </div>

          <button
            className={styles.registerBtn}
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register"}
          </button>

          {generalError && (
            <p className={styles.generalError}>{generalError}</p>
          )}

          <p className={styles.loginText}>
            Already have an account?{" "}
            <span onClick={() => router.push("/login")}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}
