import styles from "./StatusMessage.module.css";

interface StatusMessageProps {
  message: string;
}

export function StatusMessage({ message }: StatusMessageProps) {
  return (
    <p className={styles.status} role="status" aria-live="polite">
      {message}
    </p>
  );
}
