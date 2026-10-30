import styles from "./SettingToggle.module.css";

interface SettingToggleProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  secondary?: boolean;
  onChange: (checked: boolean) => void;
}

export function SettingToggle({
  id,
  label,
  description,
  checked,
  disabled = false,
  secondary = false,
  onChange,
}: SettingToggleProps) {
  const descriptionId = `${id}-description`;

  return (
    <section
      className={`${styles.row} ${secondary ? styles.secondary : ""}`}
    >
      <div>
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
        <p id={descriptionId} className={styles.description}>
          {description}
        </p>
      </div>

      <span className={styles.switch}>
        <input
          id={id}
          className={styles.input}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(event) => onChange(event.currentTarget.checked)}
        />
        <span className={styles.track} aria-hidden="true" />
      </span>
    </section>
  );
}
