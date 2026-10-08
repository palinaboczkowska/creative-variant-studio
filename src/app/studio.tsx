"use client";

import { useMemo, useState } from "react";
import {
  FORMATS,
  LANGUAGES,
  MAX_SIZE,
  MIN_SIZE,
  resolveFormat,
} from "@/lib/formats";
import { approvedToCsv } from "@/lib/export";
import type {
  BannerImage,
  Copy,
  FormatId,
  ImageLayout,
  Job,
  Size,
  Variant,
} from "@/lib/types";
import Banner from "./banner";
import { resizeImage } from "./resize-image";
import {
  DEFAULT_STYLE,
  effectiveStyle,
  type Align,
  type BannerStyle,
  type CtaShape,
  type StyleOverride,
} from "@/lib/style";
import styles from "./page.module.css";
import Logo from "./logo";
import StylePanel from "./style-panel";

const SAMPLE_PRODUCTS = `Rain Jacket; 899 kr; Waterproof, 2 colours
Wool Beanie; 249 kr; Merino wool
Trail Boots; 1299 kr; Grippy sole, sizes 36-46`;

type Filter = "all" | "favorites" | "flagged" | "needs-review" | "approved";

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
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );
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
          bannedWords: banned
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean),
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
    const res = await fetch(`/api/jobs/${job.id}/variants/${variant.id}`, {
      method: "POST",
    });
    if (!res.ok) return;
    replaceVariant(await res.json());
  }

  async function toggleFavorite(variant: Variant) {
    if (!job) return;
    const res = await fetch(
      `/api/jobs/${job.id}/variants/${variant.id}/favorite`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !variant.favorite }),
      },
    );
    if (res.ok) replaceVariant(await res.json());
  }

  async function edit(variant: Variant, change: VariantEdit) {
    if (!job) return;
    const res = await fetch(`/api/jobs/${job.id}/variants/${variant.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(change),
    });
    if (!res.ok) return;
    replaceVariant(await res.json());
  }

  function replaceVariant(updated: Variant) {
    setJob(
      (prev) =>
        prev && {
          ...prev,
          variants: prev.variants.map((v) =>
            v.id === updated.id ? updated : v,
          ),
        },
    );
  }

  const counts = useMemo(() => {
    const c = {
      all: 0,
      favorites: 0,
      flagged: 0,
      "needs-review": 0,
      approved: 0,
    };
    for (const v of job?.variants ?? []) {
      c.all++;
      if (v.favorite) c.favorites++;
      c[v.status]++;
    }
    return c;
  }, [job]);

  function exportApproved() {
    if (!job) return;
    const blob = new Blob(
      [approvedToCsv(job.variants, bannerStyle, window.location.origin)],
      {
        type: "text/csv;charset=utf-8",
      },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `approved-variants-${job.id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const visible = (job?.variants ?? []).filter(
    (v) =>
      filter === "all" ||
      (filter === "favorites" ? v.favorite : v.status === filter),
  );

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <Logo />
          <h1>Creative Variant Studio</h1>
        </div>
        <p>
          Claude writes ad copy for every product, language and format. Normal
          code checks it. A person approves it.
        </p>
      </header>

      <section className={styles.form}>
        <label className={styles.field}>
          <span>Products (name; price; details)</span>
          <textarea
            rows={5}
            value={productsCsv}
            onChange={(e) => setProductsCsv(e.target.value)}
          />
        </label>

        <div className={styles.field}>
          <span>Languages</span>
          <div className={styles.chips}>
            {LANGUAGES.map((lang) => (
              <button
                key={lang}
                type="button"
                className={
                  languages.includes(lang) ? styles.chipOn : styles.chip
                }
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

        <button
          className={styles.primary}
          onClick={generate}
          disabled={loading || languages.length === 0}
        >
          {loading ? "Generating…" : "Generate variants"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </section>

      <StylePanel value={bannerStyle} onChange={setBannerStyle} />

      {job && (
        <section>
          <div className={styles.summary}>
            <p>
              {counts.all} variants · {counts.flagged} flagged ·{" "}
              {counts.approved} approved
              {job.source === "demo" && (
                <span className={styles.demo}> · demo copy (no API key)</span>
              )}
            </p>
            <button
              className={styles.secondary}
              onClick={exportApproved}
              disabled={counts.approved === 0}
            >
              Export approved ({counts.approved})
            </button>
            <div className={styles.chips}>
              {(
                [
                  "all",
                  "favorites",
                  "flagged",
                  "needs-review",
                  "approved",
                ] as Filter[]
              ).map((f) => (
                <button
                  key={f}
                  className={filter === f ? styles.chipOn : styles.chip}
                  onClick={() => setFilter(f)}
                >
                  {f} ({counts[f]})
                </button>
              ))}
            </div>
          </div>

          <div className={styles.grid}>
            {visible.map((v) => (
              <VariantCard
                key={v.id}
                variant={v}
                bannerStyle={bannerStyle}
                onApprove={() => approve(v)}
                onEdit={(change) => edit(v, change)}
                onToggleFavorite={() => toggleFavorite(v)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

type Draft = {
  copy: Copy;
  format: FormatId;
  size: Size;
  style: StyleOverride;
  image?: BannerImage | null;
};
export type VariantEdit = Copy & {
  format: FormatId;
  size?: Size;
  style: StyleOverride;
  image?: BannerImage | null;
};

function VariantCard({
  variant,
  bannerStyle,
  onApprove,
  onToggleFavorite,
  onEdit,
}: {
  variant: Variant;
  bannerStyle: BannerStyle;
  onApprove: () => void;
  onToggleFavorite: () => void;
  onEdit: (edit: VariantEdit) => Promise<void>;
}) {
  const [draft, setDraft] = useState<Draft | null>(null);
  // While editing, the preview shows the draft so the designer sees changes live.
  const format = draft
    ? resolveFormat(draft.format, draft.size)
    : resolveFormat(variant.format, variant.size);
  const copy = draft?.copy ?? variant.copy;
  const look = effectiveStyle(bannerStyle, draft?.style ?? variant.style);
  const failed = variant.checks.filter((c) => !c.ok);
  // undefined in a draft means "unchanged"; null means the image was removed.
  const image =
    draft && draft.image !== undefined
      ? (draft.image ?? undefined)
      : variant.image;
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function upload(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const dataUrl = await resizeImage(file);
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setDraft(
        (prev) =>
          prev && {
            ...prev,
            image: { id: data.id, layout: prev.image?.layout ?? "background" },
          },
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function startEdit() {
    setDraft({
      copy: variant.copy,
      format: variant.format,
      size: { width: format.width, height: format.height },
      style: variant.style ?? {},
    });
  }

  function setStyle(change: StyleOverride) {
    setDraft(
      (prev) => prev && { ...prev, style: { ...prev.style, ...change } },
    );
  }

  async function save() {
    if (!draft) return;
    await onEdit({
      ...draft.copy,
      format: draft.format,
      // format is already clamped to the allowed range
      size:
        draft.format === "custom"
          ? { width: format.width, height: format.height }
          : undefined,
      style: draft.style,
      image: draft.image,
    });
    setDraft(null);
  }

  return (
    <article
      className={`${styles.card} ${styles[variant.status.replace("-", "")]}`}
    >
      <div className={styles.previewBox}>
        <button
          type="button"
          className={variant.favorite ? styles.starOn : styles.star}
          onClick={onToggleFavorite}
          aria-label={
            variant.favorite ? "Remove from favourites" : "Add to favourites"
          }
          aria-pressed={Boolean(variant.favorite)}
        >
          {variant.favorite ? "★" : "☆"}
        </button>
        <Banner copy={copy} format={format} look={look} image={image} />
      </div>
      <div className={styles.meta}>
        <p className={styles.title}>
          {variant.product.name} · {variant.language}
        </p>
        <p className={styles.muted}>{format.label}</p>

        {draft ? (
          <div className={styles.editor}>
            <label className={styles.editLabel}>
              <Counter
                label="Headline"
                length={draft.copy.headline.length}
                max={format.maxHeadline}
              />
              <input
                value={draft.copy.headline}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    copy: { ...draft.copy, headline: e.target.value },
                  })
                }
              />
            </label>
            <label className={styles.editLabel}>
              <Counter
                label="CTA"
                length={draft.copy.cta.length}
                max={format.maxCta}
              />
              <input
                value={draft.copy.cta}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    copy: { ...draft.copy, cta: e.target.value },
                  })
                }
              />
            </label>
            <label className={styles.editLabel}>
              Banner size
              <select
                value={draft.format}
                onChange={(e) =>
                  setDraft({ ...draft, format: e.target.value as FormatId })
                }
              >
                {FORMATS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
                <option value="custom">Custom size…</option>
              </select>
            </label>
            {draft.format === "custom" && (
              <div className={styles.sizeRow}>
                <label className={styles.editLabel}>
                  Width (px)
                  <input
                    type="number"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    value={draft.size.width}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        size: { ...draft.size, width: Number(e.target.value) },
                      })
                    }
                  />
                </label>
                <span className={styles.times}>×</span>
                <label className={styles.editLabel}>
                  Height (px)
                  <input
                    type="number"
                    min={MIN_SIZE}
                    max={MAX_SIZE}
                    value={draft.size.height}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        size: { ...draft.size, height: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              </div>
            )}
            <div className={styles.editLabel}>
              Image
              <div className={styles.actions}>
                <label className={styles.uploadButton}>
                  {uploading
                    ? "Uploading…"
                    : image
                      ? "Replace image"
                      : "Add image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    hidden
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) upload(file);
                      e.target.value = "";
                    }}
                  />
                </label>
                {image && (
                  <button
                    type="button"
                    className={styles.link}
                    onClick={() => setDraft({ ...draft, image: null })}
                  >
                    Remove
                  </button>
                )}
              </div>
              {image && (
                <div className={styles.chips}>
                  {(["background", "side"] as ImageLayout[]).map((layout) => (
                    <button
                      key={layout}
                      type="button"
                      className={
                        image.layout === layout ? styles.chipOn : styles.chip
                      }
                      onClick={() =>
                        setDraft({ ...draft, image: { id: image.id, layout } })
                      }
                    >
                      {layout === "background" ? "Background" : "Next to text"}
                    </button>
                  ))}
                </div>
              )}
              {uploadError && <span className={styles.bad}>{uploadError}</span>}
            </div>
            <label className={styles.editLabel}>
              Corners: {look.radius}px
              <input
                type="range"
                min={0}
                max={40}
                value={look.radius}
                onChange={(e) => setStyle({ radius: Number(e.target.value) })}
              />
            </label>
            <label className={styles.editLabel}>
              Text size: {Math.round(look.textScale * 100)}%
              <input
                type="range"
                min={0.7}
                max={1.6}
                step={0.05}
                value={look.textScale}
                onChange={(e) =>
                  setStyle({ textScale: Number(e.target.value) })
                }
              />
            </label>
            <div className={styles.editLabel}>
              Button shape
              <div className={styles.chips}>
                {(["square", "rounded", "pill"] as CtaShape[]).map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    className={
                      look.ctaShape === shape ? styles.chipOn : styles.chip
                    }
                    onClick={() => setStyle({ ctaShape: shape })}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.editLabel}>
              Alignment
              <div className={styles.chips}>
                {(["left", "center"] as Align[]).map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={look.align === a ? styles.chipOn : styles.chip}
                    onClick={() => setStyle({ align: a })}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.actions}>
              <button className={styles.secondary} onClick={save}>
                Save and re-check
              </button>
              <button
                className={styles.link}
                onClick={() => setDraft({ ...draft, style: {} })}
              >
                Use brand style
              </button>
              <button className={styles.link} onClick={() => setDraft(null)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <ul className={styles.checks}>
              {variant.checks.map((c) => (
                <li key={c.rule} className={c.ok ? styles.ok : styles.bad}>
                  {c.ok ? "✓" : "✗"} {c.rule}
                  {c.detail && (
                    <span className={styles.muted}> · {c.detail}</span>
                  )}
                </li>
              ))}
            </ul>
            {variant.status === "flagged" && (
              <p className={styles.bad}>
                Flagged: {failed.map((c) => c.rule).join(", ")}
              </p>
            )}
            {variant.status === "approved" && (
              <p className={styles.approved}>Approved</p>
            )}
            <div className={styles.actions}>
              {variant.status === "needs-review" && (
                <button className={styles.secondary} onClick={onApprove}>
                  Approve
                </button>
              )}
              {variant.status !== "approved" && (
                <button className={styles.link} onClick={startEdit}>
                  Edit
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function Counter({
  label,
  length,
  max,
}: {
  label: string;
  length: number;
  max: number;
}) {
  return (
    <span className={length > max ? styles.bad : undefined}>
      {label} ({length}/{max})
    </span>
  );
}
