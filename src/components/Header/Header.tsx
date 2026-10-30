import styles from "./Header.module.css";

export function Header() {
  return (
    <header className={styles.header}>
      <span className={styles.logo} aria-hidden="true">
        ▶
      </span>
      <div>
        <h1 className={styles.title}>YouTube Redesigner</h1>
        <p className={styles.subtitle}>Seu YouTube, do seu jeito.</p>
      </div>
    </header>
  );
}
