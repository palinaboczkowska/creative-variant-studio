import { FORMATS } from "./formats";
import { effectiveStyle, type BannerStyle } from "./style";
import type { Variant } from "./types";

const COLUMNS = [
  "product",
  "price",
  "language",
  "format",
  "width",
  "height",
  "headline",
  "cta",
  "background",
  "text_color",
  "button_color",
  "button_text_color",
  "font",
  "text_scale",
  "corner_radius",
  "button_shape",
  "align",
];

// One row per approved variant, with the final copy and the style it was approved with.
export function approvedToCsv(variants: Variant[], brand: BannerStyle): string {
  const rows = variants
    .filter((v) => v.status === "approved")
    .map((v) => {
      const format = FORMATS.find((f) => f.id === v.format)!;
      const s = effectiveStyle(brand, v.style);
      return [
        v.product.name,
        v.product.price,
        v.language,
        format.id,
        format.width,
        format.height,
        v.copy.headline,
        v.copy.cta,
        s.background,
        s.text,
        s.ctaBackground,
        s.ctaText,
        s.font,
        s.textScale,
        s.radius,
        s.ctaShape,
        s.align,
      ];
    });
  return [COLUMNS, ...rows].map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
