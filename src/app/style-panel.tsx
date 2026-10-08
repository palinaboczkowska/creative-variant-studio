"use client";

import { FONTS, PRESETS, type Align, type BannerStyle, type CtaShape, type FontId } from "@/lib/style";
import styles from "./page.module.css";

const COLORS: { key: "background" | "text" | "ctaBackground" | "ctaText"; label: string }[] = [
  { key: "background", label: "Background" },
  { key: "text", label: "Text" },
  { key: "ctaBackground", label: "Button" },
  { key: "ctaText", label: "Button text" },
];

export default function StylePanel({ value, onChange }: { value: BannerStyle; onChange: (s: BannerStyle) => void }) {
  const set = <K extends keyof BannerStyle>(key: K, v: BannerStyle[K]) => onChange({ ...value, [key]: v });

  return (
    <section className={styles.form}>
      <div className={styles.panelHead}>
        <h2>Brand style</h2>
        <div className={styles.chips}>
          {PRESETS.map((p) => (
            <button key={p.name} type="button" className={styles.chip} onClick={() => onChange(p.style)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.styleGrid}>
        {COLORS.map((c) => (
          <label key={c.key} className={styles.colorField}>
            <input type="color" value={value[c.key]} onChange={(e) => set(c.key, e.target.value)} />
            <span>{c.label}</span>
          </label>
        ))}
      </div>

      <div className={styles.row}>
        <label className={styles.field}>
          <span>Font</span>
          <select value={value.font} onChange={(e) => set("font", e.target.value as FontId)}>
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Text size: {Math.round(value.textScale * 100)}%</span>
          <input
            type="range"
            min={0.7}
            max={1.6}
            step={0.05}
            value={value.textScale}
            onChange={(e) => set("textScale", Number(e.target.value))}
          />
        </label>
        <label className={styles.field}>
          <span>Banner corners: {value.radius}px</span>
          <input
            type="range"
            min={0}
            max={24}
            value={value.radius}
            onChange={(e) => set("radius", Number(e.target.value))}
          />
        </label>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <span>Button shape</span>
          <div className={styles.chips}>
            {(["square", "rounded", "pill"] as CtaShape[]).map((s) => (
              <button
                key={s}
                type="button"
                className={value.ctaShape === s ? styles.chipOn : styles.chip}
                onClick={() => set("ctaShape", s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.field}>
          <span>Alignment</span>
          <div className={styles.chips}>
            {(["left", "center"] as Align[]).map((a) => (
              <button
                key={a}
                type="button"
                className={value.align === a ? styles.chipOn : styles.chip}
                onClick={() => set("align", a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
