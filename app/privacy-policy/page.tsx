import styles from "./privacy-policy.module.css";

export const metadata = {
  title: "Privacy Policy | KonektBarangay",
  description: "How KonektBarangay handles and protects resident information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: February 23, 2026</p>

      <p className={styles.intro}>
        KonektBarangay values your privacy. This policy explains what personal data we collect, why we collect it,
        and how we use and protect it when you use our barangay e-services portal.
      </p>

      <section className={styles.section}>
        <h2>1. Information We Collect</h2>
        <ul>
          <li>Account details such as full name, email address, and login credentials.</li>
          <li>Service request details such as requested document type, purpose, and appointment schedule.</li>
          <li>Basic usage data needed to keep the platform secure and working properly.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>2. How We Use Information</h2>
        <ul>
          <li>To create and manage resident accounts.</li>
          <li>To process document requests and appointment bookings.</li>
          <li>To send service-related updates and notices.</li>
          <li>To maintain security, detect misuse, and improve system performance.</li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>3. Data Sharing</h2>
        <p>
          KonektBarangay shares personal information only with authorized barangay personnel and service providers
          strictly required to run the portal. We do not sell resident personal data.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. Data Retention and Security</h2>
        <p>
          We keep your information only as long as needed for barangay service operations, legal obligations, and
          record-keeping. We apply reasonable technical and organizational safeguards to protect your data.
        </p>
      </section>

      <section className={styles.section}>
        <h2>5. Your Rights</h2>
        <p>You may request to review or update your personal information through your account or barangay office.</p>
      </section>

      <section className={styles.section}>
        <h2>6. Policy Updates</h2>
        <p>
          We may update this policy from time to time. Any changes will be posted on this page with a revised
          effective date.
        </p>
      </section>

      <div className={styles.contactBox}>
        <h3>Questions About Privacy?</h3>
        <p>
          Contact your barangay office or portal administrator for privacy-related concerns and requests regarding
          your information.
        </p>
      </div>
    </main>
  );
}
