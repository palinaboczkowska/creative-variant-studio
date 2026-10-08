import type { StyleOverride } from "./style";

export type GeneratedFormatId = "square" | "leaderboard" | "story";
export type FormatId = GeneratedFormatId | "rectangle" | "skyscraper" | "billboard" | "custom";

export type Size = { width: number; height: number };

export interface AdFormat {
  id: FormatId;
  label: string;
  width: number;
  height: number;
  maxHeadline: number;
  maxCta: number;
}

export interface Product {
  name: string;
  price: string;
  description: string;
}

export interface BrandRules {
  tone: string;
  bannedWords: string[];
}

export interface Copy {
  headline: string;
  cta: string;
}

export type Check = { ok: boolean; rule: string; detail?: string };

export type VariantStatus = "needs-review" | "flagged" | "approved";

export interface Variant {
  id: string;
  product: Product;
  language: string;
  format: FormatId;
  copy: Copy;
  checks: Check[];
  status: VariantStatus;
  // Per-variant changes a designer made on top of the shared brand style.
  style?: StyleOverride;
  favorite?: boolean;
  // Only set when format is "custom".
  size?: Size;
}

export interface Job {
  id: string;
  createdAt: string;
  rules: BrandRules;
  languages: string[];
  variants: Variant[];
  source: "claude" | "demo";
}
