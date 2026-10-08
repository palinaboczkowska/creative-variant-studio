import type { AdFormat, BrandRules, Check, Copy, Product } from "./types";

// Normal code makes the decisions that must be right. The model only writes.
export function checkCopy(copy: Copy, format: AdFormat, product: Product, rules: BrandRules): Check[] {
  const checks: Check[] = [];

  checks.push({
    ok: copy.headline.length <= format.maxHeadline,
    rule: "Headline fits",
    detail: `${copy.headline.length}/${format.maxHeadline} characters`,
  });

  checks.push({
    ok: copy.cta.length <= format.maxCta,
    rule: "CTA fits",
    detail: `${copy.cta.length}/${format.maxCta} characters`,
  });

  const text = `${copy.headline} ${copy.cta}`.toLowerCase();
  const banned = rules.bannedWords.map((w) => w.trim().toLowerCase()).filter(Boolean).filter((w) => text.includes(w));
  checks.push({
    ok: banned.length === 0,
    rule: "Brand words",
    detail: banned.length ? `Banned: ${banned.join(", ")}` : "No banned words",
  });

  // Every number in the copy must come from the product data, so the
  // model cannot invent a price or a discount.
  const allowed = new Set(numbersIn(`${product.price} ${product.description} ${product.name}`));
  const invented = numbersIn(text).filter((n) => !allowed.has(n));
  checks.push({
    ok: invented.length === 0,
    rule: "No invented numbers",
    detail: invented.length ? `Not in product data: ${invented.join(", ")}` : "All numbers come from the data",
  });

  checks.push({
    ok: copy.headline.trim().length > 0 && copy.cta.trim().length > 0,
    rule: "Not empty",
  });

  return checks;
}

export function numbersIn(text: string): string[] {
  return (text.match(/\d+(?:[.,]\d+)?/g) ?? []).map((n) => n.replace(",", "."));
}

export function parseProducts(csv: string): Product[] {
  return csv
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name = "", price = "", ...rest] = line.split(";").map((p) => p.trim());
      return { name, price, description: rest.join("; ") };
    })
    .filter((p) => p.name.length > 0);
}
