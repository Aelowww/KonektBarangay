import styles from "./terms-of-service.module.css";

export const metadata = {
  title: "Terms of Service | KonektBarangay",
  description: "Terms that govern the use of the KonektBarangay portal.",
};

export default function TermsOfServicePage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Terms of Service</h1>
      <p className={styles.updated}>Last updated: February 23, 2026</p>

      <p className={styles.intro}>
        These Terms of Service govern your access to and use of KonektBarangay. By creating an account or using this
        platform, you agree to follow these terms and all applicable local laws and regulations.
      </p>

      <section className={styles.section}>
        <h2>1. Purpose of the Platform</h2>
        <p>
          KonektBarangay is provided to help residents request barangay documents, set appointments, and track service
          requests online.
        </p>
      </section>

      <section className={styles.section}>
        <h2>2. Account Responsibilities</h2>
        <ul>
          <li>You must provide accurate and updated account information.</li>
          <li>You are responsible for keeping your account credentials secure.</li>
          <li>You must not share your account with others or impersonate another person.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Acceptable Use</h2>
        <ul>
          <li>Use the portal only for lawful and legitimate barangay transactions.</li>
          <li>Do not submit false, misleading, or abusive requests.</li>
          <li>Do not attempt to disrupt, bypass, or damage the platform and its security.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>4. Service Availability</h2>
        <p>
          We aim to keep KonektBarangay available and accurate, but service interruptions, maintenance windows, and
          occasional technical issues may occur.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Request Review and Approval</h2>
        <p>
          Submission of a request does not guarantee approval. Barangay staff may validate details, request additional
          information, and approve, reject, cancel, or complete requests based on official requirements.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Changes to Terms</h2>
        <p>
          We may update these terms to reflect service, policy, or legal changes. Updates become effective once posted
          on this page.
        </p>
      </section>

      <div className={styles.contactBox}>
        <h3>Questions About These Terms?</h3>
        <p>For clarifications, please contact your barangay office or the KonektBarangay administrator.</p>
      </div>
    </main>
  );
}
