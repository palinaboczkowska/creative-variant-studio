import type { AdFormat } from "./types";

// Each format has its own space for text. The limits are what the
// deterministic check enforces, whatever the model writes.
export const FORMATS: AdFormat[] = [
  { id: "square", label: "Square 1080×1080", width: 1080, height: 1080, maxHeadline: 40, maxCta: 18 },
  { id: "leaderboard", label: "Leaderboard 728×90", width: 728, height: 90, maxHeadline: 28, maxCta: 12 },
  { id: "story", label: "Story 1080×1920", width: 1080, height: 1920, maxHeadline: 55, maxCta: 22 },
];

export const LANGUAGES = ["English", "Swedish", "Norwegian", "Danish", "Finnish"] as const;
