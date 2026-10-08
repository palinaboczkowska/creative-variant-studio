export type FormatId = "square" | "leaderboard" | "story";

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
}

export interface Job {
  id: string;
  createdAt: string;
  rules: BrandRules;
  languages: string[];
  variants: Variant[];
  source: "claude" | "demo";
}
