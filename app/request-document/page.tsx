"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./request-document.module.css";
import { DOCUMENTS } from "../../lib/documents";
import { useAuth } from "../components/AuthProvider";
import Stepper from "../components/Stepper";
import { useResidentOnly } from "../components/useResidentOnly";
import { DocumentSpot, IconArrowRight, IconClock, IconSearch } from "../components/icons";
import VerificationBanner from "../components/VerificationBanner";

export default function RequestDocumentPage() {
  const router = useRouter();
  const { user, verification, idSubmitted } = useAuth();
  const blocked = useResidentOnly();
  const isLoggedIn = !!user;
  const needsIdUpload = verification === "rejected" || !idSubmitted;

  const [showUnverified, setShowUnverified] = useState(false);
  const [query, setQuery] = useState("");

  const handleSelect = (docTitle: string) => {
    if (!isLoggedIn) {
      router.push("/login?next=/request-document");
      return;
    }

    if (verification && verification !== "approved") {
      setShowUnverified(true);
      return;
    }

    localStorage.setItem(
      "documentRequest",
      JSON.stringify({
        documentType: docTitle,
      })
    );

    router.push("/set-appointment");
  };

  const q = query.trim().toLowerCase();
  const visible = DOCUMENTS.filter(
    (d) => !q || d.title.toLowerCase().includes(q) || d.description.toLowerCase().includes(q)
  );

  if (blocked) return null;

  return (
    <>
      <main className="kb-page">
        {isLoggedIn && <Stepper current={1} />}
        {isLoggedIn && <VerificationBanner />}

        <header className="kb-page-head">
          <div>
            <p className="kb-eyebrow">Barangay Services</p>
            <h1 className="kb-title">{isLoggedIn ? "Request a barangay document" : "Barangay Services"}</h1>
            <p className="kb-subtitle">
              {isLoggedIn
                ? "Select the document you need, then choose your preferred pickup schedule."
                : "Documents you can request online. Log in to start a request."}
            </p>
          </div>

          <div className={`kb-input-wrap ${styles.search}`}>
            <IconSearch size={18} />
            <input
              className="kb-input"
              placeholder="Search documents"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search documents"
            />
          </div>
        </header>

        <section className={styles.grid}>
          {visible.map((doc) => (
            <button key={doc.title} type="button" className={styles.card} onClick={() => handleSelect(doc.title)}>
              <DocumentSpot type={doc.title} size={48} />
              <div className={styles.cardBody}>
                <h3>{doc.title}</h3>
                <p>{doc.description}</p>
              </div>
              <IconArrowRight size={18} className={styles.arrow} />
            </button>
          ))}
          {visible.length === 0 && (
            <div className={`kb-card kb-empty ${styles.noResults}`}>
              <h3>No documents match &ldquo;{query}&rdquo;</h3>
              <p>Try a different keyword, or choose &ldquo;Other Document Request&rdquo;.</p>
            </div>
          )}
        </section>
      </main>

      {showUnverified &&
        createPortal(
          <div className="kb-modal-overlay" onClick={() => setShowUnverified(false)}>
            <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
              <div className="kb-modal-icon is-warning">
                <IconClock size={30} />
              </div>
              <h3>{needsIdUpload ? "Verify your identity first" : "Verification in progress"}</h3>
              <p>
                {needsIdUpload
                  ? "Upload a photo of a valid ID showing your registered name. Once the barangay verifies it, you can request documents."
                  : "The barangay is reviewing your ID. You can request documents once it's approved. We'll notify you."}
              </p>
              <div className="kb-modal-actions">
                <button className="kb-btn kb-btn-secondary" onClick={() => setShowUnverified(false)}>
                  {needsIdUpload ? "Later" : "OK"}
                </button>
                {needsIdUpload && (
                  <Link href="/verify-identity" className="kb-btn kb-btn-primary">
                    Upload ID
                  </Link>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
