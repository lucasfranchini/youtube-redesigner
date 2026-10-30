import { useEffect, useRef, useState } from "react";

import { VIDEO_GRID_COLUMNS } from "@/constants/preferences";

import styles from "./ColumnSetting.module.css";

interface ColumnSettingProps {
  id: string;
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

export function ColumnSetting({
  id,
  label,
  value,
  disabled = false,
  onChange,
}: ColumnSettingProps) {
  const [preview, setPreview] = useState(value);
  const committedValue = useRef(value);

  useEffect(() => {
    setPreview(value);
    committedValue.current = value;
  }, [value]);

  const commitPreview = () => {
    if (preview === committedValue.current) return;

    committedValue.current = preview;
    onChange(preview);
  };

  const descriptionId = `${id}-description`;

  return (
    <section className={styles.box}>
      <div className={styles.heading}>
        <div>
          <label className={styles.label} htmlFor={id}>
            {label}
          </label>
          <p id={descriptionId} className={styles.description}>
            Vídeos por linha no desktop.
          </p>
        </div>
        <output className={styles.value} htmlFor={id}>
          {preview}
        </output>
      </div>

      <input
        id={id}
        className={styles.range}
        type="range"
        min={VIDEO_GRID_COLUMNS.min}
        max={VIDEO_GRID_COLUMNS.max}
        step="1"
        value={preview}
        disabled={disabled}
        aria-describedby={descriptionId}
        onInput={(event) => setPreview(Number(event.currentTarget.value))}
        onPointerUp={commitPreview}
        onKeyUp={commitPreview}
        onBlur={commitPreview}
      />

      <div className={styles.ends} aria-hidden="true">
        <span>{VIDEO_GRID_COLUMNS.min}</span>
        <span>{VIDEO_GRID_COLUMNS.max}</span>
      </div>
    </section>
  );
}
