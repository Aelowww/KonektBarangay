"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./request-document.module.css";
import { useRouter } from "next/navigation";
import supabase from "../../lib/supabaseClient";
import {
  FileText,
  BadgeCheck,
  Home,
  HandHeart,
  Briefcase,
  IdCard,
  ShieldCheck,
  UserCheck,
  MoreHorizontal,
  X,
} from "lucide-react";

export default function RequestDocumentPage() {
  const router = useRouter();
  const isClient = typeof window !== "undefined";

  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsLoggedIn(!!data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const documents = [
    {
      title: "Barangay Clearance",
      description: "Required for employment, school, and legal purposes.",
      icon: FileText,
    },
    {
      title: "Barangay Certificate",
      description: "A general certification issued by the barangay.",
      icon: BadgeCheck,
    },
    {
      title: "Certificate of Residency",
      description: "Proof that you are a registered resident of the barangay.",
      icon: Home,
    },
    {
      title: "Certificate of Indigency",
      description: "Issued to residents who need financial assistance.",
      icon: HandHeart,
    },
    {
      title: "Barangay Business Clearance",
      description: "Required for business registration and permits.",
      icon: Briefcase,
    },
    {
      title: "Barangay ID Application",
      description: "Apply for an official barangay-issued ID.",
      icon: IdCard,
    },
    {
      title: "Certificate of Good Moral Character",
      description: "Certifies that the resident is of good moral standing.",
      icon: ShieldCheck,
    },
    {
      title: "Certificate of First-Time Job Seeker",
      description: "Issued to first-time job seekers for employment purposes.",
      icon: UserCheck,
    },
    {
      title: "Other Document Request",
      description: "Request a document not listed above by providing details.",
      icon: MoreHorizontal,
    },
  ];

  const handleSelect = (docTitle: string) => {
    if (!isLoggedIn) {
      setShowLoginPrompt(true);
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

  return (
    <>
      <main className={styles.container}>
        <header className={styles.header}>
          <h1>{isLoggedIn ? "Request Barangay Document" : "KonektBarangay Services"}</h1>
          <p>
            {isLoggedIn
              ? "Select the document you need and submit your request online."
              : "All barangay services available through KonektBarangay platform."}
          </p>
        </header>

        <section className={styles.grid}>
          {documents.map((doc, index) => {
            const Icon = doc.icon;

            return (
              <div key={index} className={styles.card}>
                <Icon className={styles.icon} />

                <h3>{doc.title}</h3>

                <div className={styles.cardFooter}>
                  <p>{doc.description}</p>

                  <button
                    className={styles.selectBtn}
                    onClick={() => handleSelect(doc.title)}
                  >
                    Select
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {isClient &&
        showLoginPrompt &&
        createPortal(
          <div className={styles.loginOverlay}>
            <div className={styles.loginModal}>
              <button
                className={styles.loginCloseBtn}
                onClick={() => setShowLoginPrompt(false)}
              >
                <X size={18} />
              </button>

              <h2>Login Required</h2>
              <p>Please login first to continue your request.</p>

              <button
                className={styles.loginModalBtn}
                onClick={() => router.push("/login")}
              >
                Login
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
