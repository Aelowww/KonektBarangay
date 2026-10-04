import Link from "next/link";
import Image from "next/image";
import styles from "../page.module.css";
import HeroVideo from "./HeroVideo";
import NewsPreview from "./NewsPreview";
import { IconArrowRight, IconClock, IconMapPin, SpotMission, SpotVision } from "./icons";

const STEP_IMAGES = [
  { src: "/steps/step1.png", width: 503, height: 615 },
  { src: "/steps/step2.png", width: 503, height: 615 },
  { src: "/steps/step3.png", width: 527, height: 615 },
  { src: "/steps/step4.png", width: 530, height: 615 },
  { src: "/steps/step5.png", width: 527, height: 615 },
  { src: "/steps/step6.png", width: 504, height: 615 },
];

export default function Landing() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className="kb-eyebrow">Barangay E-Services Portal</p>
            <h1>Request barangay documents online.</h1>
            <p>
              Book an appointment, submit your request, and track its status — then claim your document at the
              barangay hall.
            </p>

            <div className={styles.heroCta}>
              <Link href="/login" className="kb-btn kb-btn-primary kb-btn-lg">
                Log in <IconArrowRight size={18} />
              </Link>
              <Link href="/register" className="kb-btn kb-btn-secondary kb-btn-lg">
                Create an Account
              </Link>
            </div>

            <ul className={styles.heroInfo}>
              <li>
                <IconClock size={16} /> Office hours: Monday – Friday, 8:00 AM – 5:00 PM
              </li>
              <li>
                <IconMapPin size={16} /> Claim documents at the barangay hall
              </li>
            </ul>
          </div>

          <div className={styles.heroVisual} aria-hidden="true">
            <HeroVideo className={styles.heroVideo} src="/hero-figures/herofigures.mp4" />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeadRow}>
          <div className={styles.sectionHead}>
            <h2>Barangay News &amp; Events</h2>
            <p>Latest announcements and activities.</p>
          </div>
          <Link href="/news" className="kb-btn kb-btn-secondary kb-btn-sm">
            View all
          </Link>
        </div>
        <NewsPreview emptyText="No announcements yet. Check back soon." />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2>How to use KonektBarangay</h2>
          <p>A quick guide for new users.</p>
        </div>

        <div className={styles.stepsGrid}>
          {STEP_IMAGES.map((image, index) => (
            <article key={image.src} className={styles.stepCard}>
              <Image
                src={image.src}
                alt={`Step ${index + 1} guide`}
                className={styles.stepImage}
                width={image.width}
                height={image.height}
                loading="lazy"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.purposeGrid}>
          <article className={styles.purposeCard}>
            <SpotMission size={64} />
            <div>
              <h3>Mission</h3>
              <p>
                To deliver faster, transparent, and resident-friendly barangay services by digitizing document
                requests, appointment scheduling, and service tracking in one secure platform.
              </p>
            </div>
          </article>
          <article className={styles.purposeCard}>
            <SpotVision size={64} />
            <div>
              <h3>Vision</h3>
              <p>
                A connected barangay community where every resident can access essential local government services
                anytime, with clarity, trust, and convenience.
              </p>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
