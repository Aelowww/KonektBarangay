import styles from "./privacy-policy.module.css";

export const metadata = {
  title: "Privacy Policy | KonektBarangay",
  description: "How KonektBarangay handles and protects resident information.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Privacy Policy</h1>
      <p className={styles.updated}>Last updated: October 4, 2026</p>

      <p className={styles.intro}>
        KonektBarangay respects your privacy and processes personal data in line with the Data Privacy Act of 2012
        (Republic Act No. 10173) and its implementing rules. This policy explains what we collect, why, who can see
        it, how long we keep it, and the rights you have over your information.
      </p>

      <section className={styles.section}>
        <h2>1. Information We Collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> username, email address, and password. Your password is stored in
            encrypted (hashed) form and is never visible to barangay staff.
          </li>
          <li>
            <strong>Identity verification:</strong> your full name as it appears on your ID, the type of ID, and a
            photo of the valid ID you upload.
          </li>
          <li>
            <strong>Document requests:</strong> full name, date of birth, requested document, purpose, appointment
            date and time, and the status of each request.
          </li>
          <li>
            <strong>Blotter reports:</strong> incident type, date, time, location, your account of what happened,
            and, if you provide it, the name of the other person involved.
          </li>
          <li>
            <strong>Notifications:</strong> updates sent to you about your account, requests, and reports.
          </li>
          <li>
            <strong>Technical data:</strong> sign-in records and basic security information needed to keep the
            portal safe and to prevent spam or misuse.
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>2. Why We Collect It</h2>
        <ul>
          <li>To create and secure your account and confirm that you own your email address.</li>
          <li>
            To verify that you are a real resident before you can request documents or file reports, so that
            barangay records stay accurate and accountable.
          </li>
          <li>To process document requests and schedule your pickup appointments.</li>
          <li>To record, review, and mediate blotter reports, including scheduling hearings.</li>
          <li>To notify you about the status of your account, requests, and reports.</li>
          <li>To detect and block fraud, spam, and unauthorized access.</li>
        </ul>
        <p>
          We process your data to deliver the barangay services you ask for, to carry out the barangay&apos;s public
          functions, and, where required, with your consent, which you give when you create an account.
        </p>
      </section>

      <section className={styles.section}>
        <h2>3. Who Can See Your Information</h2>
        <ul>
          <li>
            <strong>You</strong> can see your own account, requests, reports, and notifications. Other residents
            cannot see any of your information.
          </li>
          <li>
            <strong>Authorized barangay administrators</strong> can see the information needed to verify residents
            and process requests and reports.
          </li>
          <li>
            <strong>ID photos</strong> are kept in private storage. They are shown only to administrators through
            temporary links that expire after a few minutes, and are never shown publicly.
          </li>
          <li>
            <strong>Service providers</strong> that run the portal on our behalf: Supabase (database, sign-in, and
            file storage), Vercel (website hosting), and our email delivery provider. If enabled, Cloudflare
            Turnstile is used to check that sign-ups come from real people. These providers process data only to
            provide their services to us.
          </li>
        </ul>
        <p>
          We do not sell your personal data or use it for advertising. We disclose information to government
          authorities only when required by law or a lawful order.
        </p>
      </section>

      <section className={styles.section}>
        <h2>4. How Long We Keep It</h2>
        <ul>
          <li>
            <strong>Account information</strong> is kept while your account is active. You may ask the barangay to
            close your account at any time.
          </li>
          <li>
            <strong>ID photos</strong> are kept only as long as needed to verify your identity and to resolve any
            questions about it. If you upload a new ID, only the latest one is used for review.
          </li>
          <li>
            <strong>Document requests and blotter reports</strong> form part of barangay records and are kept for
            the period required by applicable laws and record-keeping rules.
          </li>
        </ul>
        <p>When information is no longer needed, it is deleted or anonymized.</p>
      </section>

      <section className={styles.section}>
        <h2>5. How We Protect It</h2>
        <ul>
          <li>All connections to the portal are encrypted (HTTPS).</li>
          <li>
            Database rules ensure each resident can access only their own records, and only administrators can view
            or update records for processing.
          </li>
          <li>New accounts must confirm their email with a one-time code.</li>
          <li>Repeated failed sign-ins are temporarily blocked, and submissions are limited to prevent spam.</li>
          <li>Staff sign in through a separate portal, and administrator actions require an administrator account.</li>
        </ul>
        <p>
          If a security incident affects your personal data, we will notify you and the National Privacy Commission
          as required by law.
        </p>
      </section>

      <section className={styles.section}>
        <h2>6. Your Rights</h2>
        <p>Under the Data Privacy Act, you have the right to:</p>
        <ul>
          <li>Be informed about how your personal data is collected and used.</li>
          <li>Access the personal data we hold about you.</li>
          <li>Correct inaccurate or outdated information.</li>
          <li>Object to processing, or withdraw your consent, where processing is based on consent.</li>
          <li>Ask for your data to be erased or blocked when it is no longer necessary or was processed unlawfully.</li>
          <li>Get a copy of your data in a commonly used electronic format.</li>
          <li>Claim damages for harm caused by inaccurate, unlawfully obtained, or misused data.</li>
          <li>File a complaint with the National Privacy Commission (privacy.gov.ph).</li>
        </ul>
        <p>
          Some records, such as blotter reports and issued documents, may need to be kept to meet legal
          obligations even if you ask for them to be deleted. We will explain if this applies to your request.
        </p>
      </section>

      <section className={styles.section}>
        <h2>7. Policy Updates</h2>
        <p>
          We may update this policy when the portal or the law changes. Changes will be posted on this page with a
          new &ldquo;Last updated&rdquo; date.
        </p>
      </section>

      <div className={styles.contactBox}>
        <h3>Questions About Privacy?</h3>
        <p>
          To exercise your rights or raise a privacy concern, contact the barangay&apos;s Data Protection Officer at
          the barangay hall, Monday to Friday, 8:00 AM to 5:00 PM, or reach out to your portal administrator.
        </p>
      </div>
    </main>
  );
}
