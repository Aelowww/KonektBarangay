import styles from "./page.module.css";
import Link from "next/link";
import Image from "next/image";
import TypewriterText from "./components/TypewriterText";

type Line = {
  text: string;
  className?: string;
  tag?: "h1" | "p";
};

export default function Home() {
  const speed = 20;
  const stepImages = [
    { src: "/steps/step1.png", width: 503, height: 615 },
    { src: "/steps/step2.png", width: 503, height: 615 },
    { src: "/steps/step3.png", width: 527, height: 615 },
    { src: "/steps/step4.png", width: 530, height: 615 },
    { src: "/steps/step5.png", width: 527, height: 615 },
    { src: "/steps/step6.png", width: 504, height: 615 },
  ];

  const lines: Line[] = [
    { text: "Welcome to KonektBarangay", tag: "h1" },
    {
      text: "KonektBarangay is a modern e-services platform that lets residents book appointments, request barangay documents, and track service updates online with speed, transparency, and convenience.",
      className: styles.mobileText,
    },
  ];

  let accumulatedDelay = 0;
  const typedLines = lines.map((line) => {
    const delay = accumulatedDelay;
    accumulatedDelay += line.text.length * speed + 400;
    return { ...line, delay };
  });

  return (
    <>
      <main className={styles.heroSection}>
        <div className={styles.heroContent}>
          <div className={styles.typewriterWrapper}>
            {typedLines.map((line, index) => (
              <TypewriterText
                key={index}
                text={line.text}
                tag={line.tag}
                delay={line.delay}
                speed={speed}
                className={line.className}
              />
            ))}
          </div>

          <div className={styles.heroCta}>
            <Link href="/request-document" className={styles.ctaPrimary}>
              Request Document
            </Link>

            <Link href="/set-appointment" className={styles.ctaSecondary}>
              Set Appointment
            </Link>
          </div>
        </div>

        <div className={styles.heroFigure} aria-hidden="true">
          <video
            className={styles.heroVideo}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src="/hero-figures/herofigures.mp4" type="video/mp4" />
          </video>
        </div>
      </main>

      <section className={styles.stepsSection}>
        <div className={styles.stepsHeader}>
          <h2>How To Use KonektBarangay</h2>
          <p>Quick guide for new users</p>
        </div>

        <div className={styles.stepsGrid}>
          {stepImages.map((image, index) => (
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

      <section className={styles.purposeShowcase}>
        <article className={styles.purposeRow}>
          <div className={styles.missionIconWrap} aria-hidden="true">
            <Image
              src="/mission/vecteezy_mission-vector-icon-design_20540902.svg"
              alt=""
              width={260}
              height={260}
              className={styles.missionIcon}
            />
          </div>
          <div className={styles.purposeCopy}>
            <h2>MISSION</h2>
            <p>
              To deliver faster, transparent, and resident-friendly barangay services by digitizing document requests,
              appointment scheduling, and service tracking in one secure platform.
            </p>
          </div>
        </article>

        <article className={`${styles.purposeRow} ${styles.purposeRowReverse}`}>
          <div className={styles.purposeCopy}>
            <h2>VISION</h2>
            <p>
              A connected barangay community where every resident can access essential local government services
              anytime, with clarity, trust, and convenience.
            </p>
          </div>
          <div className={styles.missionIconWrap} aria-hidden="true">
            <Image
              src="/vision/vecteezy_eye-vector-icon-design_26087822.svg"
              alt=""
              width={260}
              height={260}
              className={styles.missionIcon}
            />
          </div>
        </article>
      </section>
    </>
  );
}
