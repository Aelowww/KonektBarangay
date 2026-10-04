"use client";

import Image from "next/image";
import Link from "next/link";
import styles from "./footer.module.css";
import { IconClock, IconMapPin, IconMegaphone } from "./icons";

export default function Footer() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.strip} />
      <div className={styles.footerInner}>
        <section className={styles.footerBrand}>
          <Link href="/" className={styles.brandRow} aria-label="KonektBarangay home">
            <span className={styles.seal}>
              <Image src="/logo/logo-mark.png" alt="" width={34} height={34} />
            </span>
            <span>
              <strong>KonektBarangay</strong>
              <small>Barangay E-Services Portal</small>
            </span>
          </Link>
          <p className={styles.footerDescription}>
            Digital barangay services that make document requests and appointments faster, clearer, and more
            accessible for every resident.
          </p>
        </section>

        <section className={styles.footerLinks}>
          <h3>Services</h3>
          <Link href="/request-document">Request Document</Link>
          <Link href="/set-appointment">Set Appointment</Link>
          <Link href="/manage-services">Track Requests</Link>
          <Link href="/blotter">Blotter Report</Link>
          <Link href="/news">News &amp; Events</Link>
        </section>

        <section className={styles.footerLinks}>
          <h3>Legal</h3>
          <Link href="/terms-of-service">Terms of Service</Link>
          <Link href="/privacy-policy">Privacy Policy</Link>
        </section>

        <section className={styles.footerContact}>
          <h3>Barangay Hall</h3>
          <p>
            <IconClock size={16} /> Mon – Fri, 8:00 AM – 5:00 PM
          </p>
          <p>
            <IconMapPin size={16} /> Visit your barangay office for walk-in concerns
          </p>
          <p>
            <IconMegaphone size={16} /> Questions? Reach out to your barangay administrator
          </p>
        </section>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} KonektBarangay. Serbisyong mabilis, malinaw, at maaasahan.</span>
      </div>
    </footer>
  );
}
