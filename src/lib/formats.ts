import type { AdFormat, GeneratedFormatId } from "./types";

// Each format has its own space for text. The limits are what the
// deterministic check enforces, whatever the model writes.
export const FORMATS: AdFormat[] = [
  { id: "square", label: "Square 1080×1080", width: 1080, height: 1080, maxHeadline: 40, maxCta: 18 },
  { id: "leaderboard", label: "Leaderboard 728×90", width: 728, height: 90, maxHeadline: 28, maxCta: 12 },
  { id: "story", label: "Story 1080×1920", width: 1080, height: 1920, maxHeadline: 55, maxCta: 22 },
  { id: "rectangle", label: "Medium rectangle 300×250", width: 300, height: 250, maxHeadline: 30, maxCta: 14 },
  { id: "skyscraper", label: "Skyscraper 160×600", width: 160, height: 600, maxHeadline: 35, maxCta: 12 },
  { id: "billboard", label: "Billboard 970×250", width: 970, height: 250, maxHeadline: 50, maxCta: 20 },
];

export const FORMAT_IDS = ["square", "leaderboard", "story", "rectangle", "skyscraper", "billboard"] as const;

// Claude writes copy for these. The others are available when a designer edits a variant.
export const GENERATED_FORMATS = FORMATS.filter((f): f is AdFormat & { id: GeneratedFormatId } =>
  ["square", "leaderboard", "story"].includes(f.id),
);

export const LANGUAGES = ["English", "Swedish", "Norwegian", "Danish", "Finnish"] as const;
