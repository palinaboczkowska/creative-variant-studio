export type FontId = "geist" | "grotesk" | "playfair" | "bebas";
export type CtaShape = "square" | "rounded" | "pill";
export type Align = "left" | "center";

export type StyleOverride = Partial<Pick<BannerStyle, "radius" | "ctaShape" | "textScale" | "align">>;

export interface BannerStyle {
  background: string;
  text: string;
  ctaBackground: string;
  ctaText: string;
  font: FontId;
  textScale: number;
  radius: number;
  ctaShape: CtaShape;
  align: Align;
}

export const FONTS: { id: FontId; label: string; cssVar: string }[] = [
  { id: "geist", label: "Geist (clean)", cssVar: "var(--font-geist-sans)" },
  { id: "grotesk", label: "Space Grotesk (tech)", cssVar: "var(--font-grotesk)" },
  { id: "playfair", label: "Playfair Display (premium)", cssVar: "var(--font-playfair)" },
  { id: "bebas", label: "Bebas Neue (bold)", cssVar: "var(--font-bebas)" },
];

export const PRESETS: { name: string; style: BannerStyle }[] = [
  {
    name: "Nordic",
    style: {
      background: "#16213a",
      text: "#ffffff",
      ctaBackground: "#c4552b",
      ctaText: "#ffffff",
      font: "geist",
      textScale: 1,
      radius: 6,
      ctaShape: "rounded",
      align: "left",
    },
  },
  {
    name: "Bold sale",
    style: {
      background: "#ffd60a",
      text: "#111111",
      ctaBackground: "#111111",
      ctaText: "#ffd60a",
      font: "bebas",
      textScale: 1.3,
      radius: 0,
      ctaShape: "square",
      align: "center",
    },
  },
  {
    name: "Premium",
    style: {
      background: "#f4efe6",
      text: "#2b2622",
      ctaBackground: "#2b2622",
      ctaText: "#f4efe6",
      font: "playfair",
      textScale: 1.1,
      radius: 2,
      ctaShape: "pill",
      align: "center",
    },
  },
  {
    name: "Tech",
    style: {
      background: "#0b0f19",
      text: "#a7f3d0",
      ctaBackground: "#34d399",
      ctaText: "#0b0f19",
      font: "grotesk",
      textScale: 1,
      radius: 12,
      ctaShape: "pill",
      align: "left",
    },
  },
];

export const DEFAULT_STYLE = PRESETS[0].style;

export function fontFamily(id: FontId): string {
  return FONTS.find((f) => f.id === id)?.cssVar ?? FONTS[0].cssVar;
}

export function ctaRadius(shape: CtaShape): number {
  return shape === "pill" ? 999 : shape === "rounded" ? 4 : 0;
}

export function effectiveStyle(brand: BannerStyle, override?: StyleOverride): BannerStyle {
  return { ...brand, ...override };
}
