"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";
import { FULL_NAME_PATTERN } from "../../lib/authHelpers";
import { useAuth } from "../components/AuthProvider";
import {
  IconAlert,
  IconCheckCircle,
  IconClock,
  IconInfo,
  IconShield,
  IconXCircle,
  SpotBarangayId,
} from "../components/icons";
import styles from "./verify-identity.module.css";

const ID_TYPES = [
  "PhilSys National ID",
  "Driver's License",
  "UMID / SSS ID",
  "Passport",
  "Postal ID",
  "Voter's ID",
  "PRC ID",
  "Senior Citizen ID",
  "PWD ID",
  "Student ID",
  "Barangay ID",
  "Other government-issued ID",
];

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

function friendlyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("kb_already_verified")) return "Your account is already verified.";
  if (m.includes("kb_bad_name")) return "Enter your full name exactly as it appears on your ID.";
  if (m.includes("kb_admin")) return "Administrator accounts don't need ID verification.";
  if (m.includes("payload too large") || m.includes("exceeded")) return "The photo is too large. Please use one under 5 MB.";
  if (m.includes("mime") || m.includes("invalid_mime_type")) return "Please upload a JPG, PNG, or WebP photo.";
  if (m.includes("failed to fetch") || m.includes("network")) return "Network error. Check your connection and try again.";
  return "We couldn't submit your ID. Please try again.";
}

export default function VerifyIdentityPage() {
  const router = useRouter();
  const { user, role, resolved, verification, idSubmitted, verificationNote, refreshProfile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState(() => (user?.user_metadata?.full_name as string | undefined) ?? "");
  const [idType, setIdType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!resolved) return;
    if (!user) router.replace("/login?next=/verify-identity");
    else if (role === "admin") router.replace("/admin/residents");
  }, [resolved, user, role, router]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const pickFile = (f: File | null) => {
    setError("");
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      setError("Please upload a JPG, PNG, or WebP photo of your ID.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("The photo is too large. Please use one under 5 MB.");
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !user) return;
    setError("");

    const name = fullName.trim().replace(/\s+/g, " ");
    if (!FULL_NAME_PATTERN.test(name) || name.split(" ").length < 2) {
      setError("Enter your full name exactly as it appears on your ID (first and last name).");
      return;
    }
    if (!idType) {
      setError("Choose the type of ID you're uploading.");
      return;
    }
    if (!file) {
      setError("Attach a photo of your ID.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm that the ID is yours and shows your registered name.");
      return;
    }

    setSubmitting(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${user.id}/id-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("resident-ids")
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setSubmitting(false);
      setError(friendlyError(uploadError.message));
      return;
    }

    const { error: submitError } = await supabase.rpc("kb_submit_resident_id", {
      p_path: path,
      p_id_type: idType,
      p_full_name: name,
    });
    if (submitError) {
      setSubmitting(false);
      setError(friendlyError(submitError.message));
      return;
    }

    await supabase.auth.updateUser({ data: { full_name: name } });

    await refreshProfile();
    setSubmitting(false);
    setFile(null);
    setPreview(null);
  };

  if (!resolved || !user || role === "admin" || verification === null) {
    return (
      <div className="kb-loader" role="status" aria-live="polite">
        <div className="kb-loader-inner">
          <div className="kb-spinner" />
        </div>
      </div>
    );
  }

  if (verification === "approved") {
    return (
      <div className="kb-page kb-page-narrow">
        <div className={`kb-card ${styles.statusCard}`}>
          <div className="kb-modal-icon is-success">
            <IconCheckCircle size={32} />
          </div>
          <h1>Your identity is verified</h1>
          <p>You can now request barangay documents online.</p>
          <Link href="/request-document" className="kb-btn kb-btn-primary">
            Request a document
          </Link>
        </div>
      </div>
    );
  }

  const showForm = !idSubmitted || verification === "rejected";

  if (!showForm) {
    return (
      <div className="kb-page kb-page-narrow">
        <div className={`kb-card ${styles.statusCard}`}>
          <div className="kb-modal-icon is-warning">
            <IconClock size={32} />
          </div>
          <h1>ID submitted — under review</h1>
          <p>
            Barangay staff will compare your ID with your registered name. We&apos;ll notify you once your account is
            verified. You can browse the portal in the meantime.
          </p>
          <div className={styles.statusActions}>
            <Link href="/" className="kb-btn kb-btn-primary">
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kb-page kb-page-narrow">
      <header className="kb-page-head">
        <div>
          <p className="kb-eyebrow">Account verification</p>
          <h1 className="kb-title">Verify your identity</h1>
          <p className="kb-subtitle">
            Upload a photo of a valid ID so the barangay can confirm you are a real resident. This is required before
            you can request documents.
          </p>
        </div>
      </header>

      {verification === "rejected" && (
        <div className="kb-alert" style={{ marginBottom: 18 }}>
          <IconXCircle size={18} />
          <span>
            Your previous ID couldn&apos;t be verified{verificationNote ? `: ${verificationNote}` : "."} Please upload a
            clear photo of a valid ID.
          </span>
        </div>
      )}

      <div className={styles.layout}>
        <form className={`kb-card ${styles.formCard}`} onSubmit={submit} noValidate>
          <div className="kb-field">
            <label className="kb-label" htmlFor="fullName">
              Full name <small>(exactly as it appears on your ID)</small>
            </label>
            <input
              id="fullName"
              className="kb-input"
              autoComplete="name"
              maxLength={80}
              placeholder="Juan P. Dela Cruz"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="kb-field">
            <label className="kb-label" htmlFor="idType">
              Type of ID
            </label>
            <select id="idType" className="kb-select" value={idType} onChange={(e) => setIdType(e.target.value)}>
              <option value="">Select an ID</option>
              {ID_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="kb-field">
            <span className="kb-label">Photo of your ID</span>
            <button
              type="button"
              className={`${styles.dropzone} ${preview ? styles.hasPreview : ""}`}
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              {preview ? (
                <img src={preview} alt="Selected ID preview" />
              ) : (
                <>
                  <SpotBarangayId size={56} />
                  <strong>Tap to take or choose a photo</strong>
                  <span>JPG, PNG, or WebP · up to 5 MB</span>
                </>
              )}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            {preview && (
              <button type="button" className={styles.changeBtn} onClick={() => fileRef.current?.click()}>
                Choose a different photo
              </button>
            )}
          </div>

          <label className={styles.confirm}>
            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
            <span>This ID is mine and shows the name I entered above. I understand it will only be viewed by barangay staff.</span>
          </label>

          {error && (
            <div className="kb-alert">
              <IconAlert size={18} /> {error}
            </div>
          )}

          <div className={styles.formActions}>
            <button type="submit" className="kb-btn kb-btn-primary kb-btn-lg" disabled={submitting}>
              {submitting ? "Uploading..." : "Submit for verification"}
            </button>
          </div>
        </form>

        <aside className={`kb-card ${styles.tips}`}>
          <h2>
            <IconInfo size={18} /> Photo tips
          </h2>
          <ul>
            <li>Use a valid, unexpired government-issued ID.</li>
            <li>Show the whole ID — all four corners visible.</li>
            <li>Make sure your name and photo are clear and not blurry.</li>
            <li>Avoid glare from lights or flash.</li>
          </ul>
          <p className={styles.privacy}>
            <IconShield size={16} /> Your ID is stored privately. Only you and authorized barangay staff can see it.
          </p>
        </aside>
      </div>
    </div>
  );
}
