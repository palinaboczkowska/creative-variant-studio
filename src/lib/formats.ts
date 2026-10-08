import type { AdFormat, FormatId, GeneratedFormatId, Size } from "./types";

// Each format has its own space for text. The limits are what the
// deterministic check enforces, whatever the model writes.
export const FORMATS: AdFormat[] = [
  {
    id: "square",
    label: "Square 1080×1080",
    width: 1080,
    height: 1080,
    maxHeadline: 40,
    maxCta: 18,
  },
  {
    id: "leaderboard",
    label: "Leaderboard 728×90",
    width: 728,
    height: 90,
    maxHeadline: 28,
    maxCta: 12,
  },
  {
    id: "story",
    label: "Story 1080×1920",
    width: 1080,
    height: 1920,
    maxHeadline: 55,
    maxCta: 22,
  },
  {
    id: "rectangle",
    label: "Medium rectangle 300×250",
    width: 300,
    height: 250,
    maxHeadline: 30,
    maxCta: 14,
  },
  {
    id: "skyscraper",
    label: "Skyscraper 160×600",
    width: 160,
    height: 600,
    maxHeadline: 35,
    maxCta: 12,
  },
  {
    id: "billboard",
    label: "Billboard 970×250",
    width: 970,
    height: 250,
    maxHeadline: 50,
    maxCta: 20,
  },
];

export const FORMAT_IDS = [
  "square",
  "leaderboard",
  "story",
  "rectangle",
  "skyscraper",
  "billboard",
  "custom",
] as const;

// Claude writes copy for these. The others are available when a designer edits a variant.
export const GENERATED_FORMATS = FORMATS.filter(
  (f): f is AdFormat & { id: GeneratedFormatId } =>
    ["square", "leaderboard", "story"].includes(f.id),
);

export const LANGUAGES = [
  "English",
  "Swedish",
  "Norwegian",
  "Danish",
  "Finnish",
] as const;

export const MIN_SIZE = 50;
export const MAX_SIZE = 4000;

// Banners are designed at a size where text sizes make sense. Big social
// formats (1080 px) are scaled down so their short side is 360 px; web
// banners keep their real size.
export function designSize(width: number, height: number): Size {
  const factor = Math.max(1, Math.min(width, height) / 360);
  return { width: width / factor, height: height / factor };
}

// Text limits for any size, estimated from the banner's design area.
// Calibrated so the standard formats get roughly the limits above.
export function customFormat(width: number, height: number): AdFormat {
  const w = clamp(Math.round(width), MIN_SIZE, MAX_SIZE);
  const h = clamp(Math.round(height), MIN_SIZE, MAX_SIZE);
  const d = designSize(w, h);
  const maxHeadline = clamp(
    Math.round(
      d.width / d.height > 3
        ? wideCapacity(d)
        : Math.sqrt(d.width * d.height) / 9,
    ),
    10,
    90,
  );
  const maxCta = clamp(Math.round(maxHeadline * 0.45), 6, 25);
  return {
    id: "custom",
    label: `Custom ${w}×${h}`,
    width: w,
    height: h,
    maxHeadline,
    maxCta,
  };
}

// Wide banners put the headline and button on one row, so capacity depends
// on width and how many lines fit, not on area.
function wideCapacity(d: Size): number {
  const fontPx = clamp(d.height * 0.3, 18, 56);
  const charsPerLine = (d.width * 0.7) / (fontPx * 0.55);
  const lines = Math.max(1, Math.floor((d.height * 0.6) / (fontPx * 1.15)));
  return charsPerLine * lines;
}

export function resolveFormat(id: FormatId, size?: Size): AdFormat {
  if (id === "custom")
    return customFormat(size?.width ?? 300, size?.height ?? 250);
  return FORMATS.find((f) => f.id === id)!;
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Number.isFinite(n) ? n : min));
}
