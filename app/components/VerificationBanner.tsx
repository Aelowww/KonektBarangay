"use client";

import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { IconArrowRight, IconClock, IconXCircle } from "./icons";

export default function VerificationBanner() {
  const { role, verification, idSubmitted, verificationNote } = useAuth();

  if (role === "admin" || !verification || verification === "approved") return null;

  const rejected = verification === "rejected";
  const needsUpload = rejected || !idSubmitted;

  const title = rejected
    ? "ID verification unsuccessful"
    : idSubmitted
      ? "Your ID is being reviewed"
      : "Verify your identity to start requesting documents";

  const body = rejected
    ? `We couldn't verify your ID${verificationNote ? `: ${verificationNote}` : "."} Please upload a clear photo of a valid ID.`
    : idSubmitted
      ? "Barangay staff will check that your ID matches the name you entered. We'll notify you once you're verified."
      : "Enter your full name and upload a photo of a valid ID. Barangay staff will review it.";

  return (
    <div className={`kb-verify-banner ${rejected ? "is-rejected" : ""}`} role="status">
      <span className="kb-verify-icon">{rejected ? <IconXCircle size={22} /> : <IconClock size={22} />}</span>
      <div className="kb-verify-text">
        <strong>{title}</strong>
        <p>{body}</p>
      </div>
      {needsUpload && (
        <Link href="/verify-identity" className="kb-btn kb-btn-primary kb-btn-sm kb-verify-cta">
          Upload ID <IconArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
