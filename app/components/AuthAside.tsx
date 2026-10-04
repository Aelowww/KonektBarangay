import styles from "../login/login.module.css";
import { IconCheckCircle, SpotResident } from "./icons";

export default function AuthAside({ title, text }: { title: string; text: string }) {
  return (
    <aside className={styles.aside}>
      <span className={styles.asideTag}>Barangay E-Services Portal</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <ul className={styles.benefits}>
        <li>
          <IconCheckCircle size={18} /> Request barangay documents online
        </li>
        <li>
          <IconCheckCircle size={18} /> Book a weekday appointment slot
        </li>
        <li>
          <IconCheckCircle size={18} /> Track status &amp; get notified
        </li>
      </ul>
      <div className={styles.asideArt} aria-hidden="true">
        <SpotResident size={200} />
      </div>
    </aside>
  );
}
