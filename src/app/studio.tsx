"use client";

import { useMemo, useState } from "react";
import { FORMATS, LANGUAGES } from "@/lib/formats";
import type { Copy, Job, Variant } from "@/lib/types";
import { ctaRadius, DEFAULT_STYLE, fontFamily, type BannerStyle } from "@/lib/style";
import styles from "./page.module.css";
import Logo from "./logo";
import StylePanel from "./style-panel";

const SAMPLE_PRODUCTS = `Rain Jacket; 899 kr; Waterproof, 2 colours
Wool Beanie; 249 kr; Merino wool
Trail Boots; 1299 kr; Grippy sole, sizes 36-46`;

type Filter = "all" | "flagged" | "needs-review" | "approved";

export default function Studio() {
  const [productsCsv, setProductsCsv] = useState(SAMPLE_PRODUCTS);
  const [languages, setLanguages] = useState<string[]>(["English", "Swedish"]);
  const [tone, setTone] = useState("friendly and clear");
  const [banned, setBanned] = useState("cheap, best ever, guaranteed");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [bannerStyle, setBannerStyle] = useState<BannerStyle>(DEFAULT_STYLE);

  function toggleLanguage(lang: string) {
    setLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  }

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productsCsv,
          languages,
          tone,
          bannedWords: banned.split(",").map((w) => w.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setJob(data);
      setFilter("all");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function approve(variant: Variant) {
    if (!job) return;
    const res = await fetch(`/api/jobs/${job.id}/variants/${variant.id}`, { method: "POST" });
    if (!res.ok) return;
    replaceVariant(await res.json());
  }

  async function edit(variant: Variant, copy: Copy) {
    if (!job) return;
    const res = await fetch(`/api/jobs/${job.id}/variants/${variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(copy),
    });
    if (!res.ok) return;
    replaceVariant(await res.json());
  }

  function replaceVariant(updated: Variant) {
    setJob((prev) => prev && { ...prev, variants: prev.variants.map((v) => (v.id === updated.id ? updated : v)) });
  }

  const counts = useMemo(() => {
    const c = { all: 0, flagged: 0, "needs-review": 0, approved: 0 };
    for (const v of job?.variants ?? []) {
      c.all++;
      c[v.status]++;
    }
    return c;
  }, [job]);

  const visible = (job?.variants ?? []).filter((v) => filter === "all" || v.status === filter);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo />
          <h1>Creative Variant Studio</h1>
        </div>
        <p>Claude writes ad copy for every product, language and format. Normal code checks it. A person approves it.</p>
      </header>

      <section className={styles.form}>
        <label className={styles.field}>
          <span>Products (name; price; details)</span>
          <textarea rows={5} value={productsCsv} onChange={(e) => setProductsCsv(e.target.value)} />
        </label>

        <div className={styles.field}>
          <span>Languages</span>
          <div className={styles.chips}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                className={languages.includes(lang) ? styles.chipOn : styles.chip}
                onClick={() => toggleLanguage(lang)}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span>Tone of voice</span>
            <input value={tone} onChange={(e) => setTone(e.target.value)} />
          </label>
          <label className={styles.field}>
            <span>Banned words (comma separated)</span>
            <input value={banned} onChange={(e) => setBanned(e.target.value)} />
          </label>
        </div>

        <button className={styles.primary} onClick={generate} disabled={loading || languages.length === 0}>
          {loading ? "Generating…" : "Generate variants"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <StylePanel value={bannerStyle} onChange={setBannerStyle} />

      {job && (
        <section>
          <div className={styles.summary}>
            <p>
              {counts.all} variants · {counts.flagged} flagged · {counts.approved} approved
              {job.source === "demo" && <span className={styles.demo}> · demo copy (no API key)</span>}
            </p>
            <div className={styles.chips}>
              {(["all", "flagged", "needs-review", "approved"] as Filter[]).map((f) => (
                <button key={f} className={filter === f ? styles.chipOn : styles.chip} onClick={() => setFilter(f)}>
                  {f} ({counts[f]})
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            {visible.map((v) => (
              <VariantCard key={v.id} variant={v} bannerStyle={bannerStyle} onApprove={() => approve(v)} onEdit={(copy) => edit(v, copy)} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function VariantCard({
  variant,
  bannerStyle,
  onApprove,
  onEdit,
}: {
  variant: Variant;
  bannerStyle: BannerStyle;
  onApprove: () => void;
  onEdit: (copy: Copy) => Promise<void>;
}) {
  const format = FORMATS.find((f) => f.id === variant.format)!;
  const failed = variant.checks.filter((c) => !c.ok);
  const [draft, setDraft] = useState<Copy | null>(null);
  const box = previewSize(format.width, format.height);
  const wide = format.width / format.height > 3;

  async function save() {
    if (!draft) return;
    await onEdit(draft);
    setDraft(null);
  }

  return (
    <article className={`${styles.card} ${styles[variant.status.replace("-", "")]}`}>
      <div className={styles.previewBox}>
        <div
          className={wide ? styles.previewWide : styles.preview}
          style={{
            width: box.width,
            height: box.height,
            background: bannerStyle.background,
            color: bannerStyle.text,
            fontFamily: fontFamily(bannerStyle.font),
            fontSize: (wide ? 11 : 13) * bannerStyle.textScale,
            borderRadius: bannerStyle.radius,
            textAlign: bannerStyle.align,
            alignItems: wide ? "center" : bannerStyle.align === "center" ? "center" : "flex-start",
          }}
        >
          <strong>{variant.copy.headline}</strong>
          <span
            className={styles.cta}
            style={{
              background: bannerStyle.ctaBackground,
              color: bannerStyle.ctaText,
              borderRadius: ctaRadius(bannerStyle.ctaShape),
              fontSize: (wide ? 9 : 11) * bannerStyle.textScale,
            }}
          >
            {variant.copy.cta}
          </span>
        </div>
      </div>
      <div className={styles.meta}>
        <p className={styles.title}>
          {variant.product.name} · {variant.language}
        </p>
        <p className={styles.muted}>{format.label}</p>
        <ul className={styles.checks}>
          {variant.checks.map((c) => (
            <li key={c.rule} className={c.ok ? styles.ok : styles.bad}>
              {c.ok ? "✓" : "✗"} {c.rule}
              {c.detail && <span className={styles.muted}> · {c.detail}</span>}
            </li>
          ))}
        </ul>
        {variant.status === "flagged" && <p className={styles.bad}>Flagged: {failed.map((c) => c.rule).join(", ")}</p>}
        {variant.status === "approved" && <p className={styles.approved}>Approved</p>}

        {draft ? (
          <div className={styles.editor}>
            <input
              aria-label="Headline"
              value={draft.headline}
              onChange={(e) => setDraft({ ...draft, headline: e.target.value })}
            />
            <span className={styles.muted}>
              {draft.headline.length}/{format.maxHeadline}
            </span>
            <input aria-label="CTA" value={draft.cta} onChange={(e) => setDraft({ ...draft, cta: e.target.value })} />
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={save}>
                Save and re-check
              </button>
              <button className={styles.link} onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.actions}>
            {variant.status === "needs-review" && (
              <button className={styles.secondary} onClick={onApprove}>
                Approve
              </button>
            )}
            {variant.status !== "approved" && (
              <button className={styles.link} onClick={() => setDraft(variant.copy)}>
                Edit copy
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

// Scales a format to fit the 300×168 preview area and keeps its proportions.
function previewSize(width: number, height: number) {
  const scale = Math.min(300 / width, 168 / height);
  return { width: Math.round(width * scale), height: Math.max(Math.round(height * scale), 40) };
}
