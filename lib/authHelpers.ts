const PENDING_EMAIL_KEY = "kb_pending_email";
const PENDING_SENT_KEY = "kb_pending_sent";
const LOGIN_THROTTLE_KEY = "kb_login_throttle";

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCK_SECONDS = 60;
export const RESEND_COOLDOWN_SECONDS = 60;

export function setPendingEmail(email: string, codeSent = true) {
  try {
    sessionStorage.setItem(PENDING_EMAIL_KEY, email);
    sessionStorage.setItem(PENDING_SENT_KEY, codeSent ? "1" : "0");
  } catch {}
}

export function pendingCodeWasSent() {
  try {
    return sessionStorage.getItem(PENDING_SENT_KEY) === "1";
  } catch {
    return false;
  }
}

export function getPendingEmail() {
  try {
    return sessionStorage.getItem(PENDING_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function clearPendingEmail() {
  try {
    sessionStorage.removeItem(PENDING_EMAIL_KEY);
    sessionStorage.removeItem(PENDING_SENT_KEY);
  } catch {}
}

const LAST_ACTIVITY_KEY = "kb_last_activity";

export const IDLE_LIMIT_MS = 30 * 60 * 1000;

export function markActivity() {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
  } catch {}
}

export function lastActivity(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function clearActivity() {
  try {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  } catch {}
}

export function safeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

type Throttle = { count: number; until: number };

function readThrottle(): Throttle {
  try {
    const raw = JSON.parse(localStorage.getItem(LOGIN_THROTTLE_KEY) || "null");
    if (raw && typeof raw.count === "number" && typeof raw.until === "number") return raw;
  } catch {}
  return { count: 0, until: 0 };
}

function writeThrottle(t: Throttle) {
  try {
    localStorage.setItem(LOGIN_THROTTLE_KEY, JSON.stringify(t));
  } catch {}
}

export function loginLockRemaining() {
  const t = readThrottle();
  return Math.max(0, Math.ceil((t.until - Date.now()) / 1000));
}

export function recordLoginFailure() {
  const t = readThrottle();
  const count = t.until > Date.now() ? t.count : t.count + 1;
  if (count >= MAX_LOGIN_ATTEMPTS) {
    writeThrottle({ count: 0, until: Date.now() + LOGIN_LOCK_SECONDS * 1000 });
    return LOGIN_LOCK_SECONDS;
  }
  writeThrottle({ count, until: 0 });
  return 0;
}

export function clearLoginFailures() {
  try {
    localStorage.removeItem(LOGIN_THROTTLE_KEY);
  } catch {}
}

export function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[@#$%^&*!?._-]/.test(password),
  };
}

export const FULL_NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿÑñ][A-Za-zÀ-ÖØ-öø-ÿÑñ .'-]{1,79}$/;
export const USERNAME_PATTERN = /^[A-Za-z0-9_.]{3,20}$/;

export function friendlyAuthError(message: string | undefined) {
  const m = (message ?? "").toLowerCase();
  if (m.includes("email not confirmed")) return "Please verify your email first. We can send you a new code.";
  if (m.includes("invalid login credentials")) return "Incorrect email or password.";
  if (m.includes("captcha")) return "Please complete the human verification and try again.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("security purposes"))
    return "Too many attempts. Please wait a moment before trying again.";
  if (m.includes("token has expired") || m.includes("otp_expired") || m.includes("expired"))
    return "That code has expired. Request a new one.";
  if (m.includes("invalid") && m.includes("token")) return "That code is incorrect. Please check and try again.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "An account with this email already exists. Try logging in instead.";
  if (m.includes("password should")) return message ?? "Password does not meet requirements.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Network error. Check your connection and try again.";
  return message || "Something went wrong. Please try again.";
}
