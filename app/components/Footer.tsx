"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerTopWave} />

      <div className={styles.footerInner}>
        <section className={styles.footerBrand}>
          <Link href="/" className={styles.footerLogoLink} aria-label="KonektBarangay home">
            <div className={styles.footerLogoFrame}>
              <Image
                src="/logo/logo.png"
                alt="KonektBarangay"
                width={200}
                height={60}
                className={styles.footerLogo}
              />
            </div>
          </Link>

          <p className={styles.footerDescription}>
            Digital barangay services that make document requests and appointments faster, clearer, and more
            accessible for every resident.
          </p>
        </section>

        <section className={styles.footerLinks}>
          <h3>Product</h3>
          <Link href="/request-document">Request Document</Link>
          <Link href="/set-appointment">Set Appointment</Link>
          <Link href="/manage-services">Manage Services</Link>
        </section>

        <section className={styles.footerLinks}>
          <h3>Legal</h3>
          <Link href="/terms-of-service">Terms of Service</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </section>

        <section className={styles.footerContact}>
          <h3>Get in touch?</h3>
          <p>Questions or feedback about KonektBarangay?</p>
          <p>Reach out to your barangay office administrator.</p>
        </section>
      </div>
    </footer>
  );
}
