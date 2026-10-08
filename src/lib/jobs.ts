import { randomUUID } from "node:crypto";
import { FORMATS } from "./formats";
import { hasApiKey, writeCopy } from "./generate";
import { checkCopy } from "./validate";
import type { BrandRules, Job, Product, Variant } from "./types";

export async function createJob(products: Product[], languages: string[], rules: BrandRules): Promise<Job> {
  const pairs = products.flatMap((product) => languages.map((language) => ({ product, language })));

  // One model call per product and language, run in parallel.
  const sets = await Promise.all(pairs.map(({ product, language }) => writeCopy(product, language, rules)));

  const variants: Variant[] = pairs.flatMap(({ product, language }, i) =>
    FORMATS.map((format) => {
      const copy = sets[i][format.id];
      const checks = checkCopy(copy, format, product, rules);
      return {
        id: randomUUID(),
        product,
        language,
        format: format.id,
        copy,
        checks,
        status: checks.every((c) => c.ok) ? "needs-review" : "flagged",
      };
    }),
  );

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    rules,
    languages,
    variants,
    source: hasApiKey() ? "claude" : "demo",
  };
}
