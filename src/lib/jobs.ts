import { randomUUID } from "node:crypto";
import { GENERATED_FORMATS } from "./formats";
import { hasApiKey, translateBannedWords, writeCopy } from "./generate";
import { checkCopy } from "./validate";
import type { BrandRules, Job, Product, Variant } from "./types";

export async function createJob(
  products: Product[],
  languages: string[],
  baseRules: BrandRules,
): Promise<Job> {
  const rules: BrandRules = {
    ...baseRules,
    bannedByLanguage: await translateBannedWords(
      baseRules.bannedWords,
      languages,
    ),
  };
  const pairs = products.flatMap((product) =>
    languages.map((language) => ({ product, language })),
  );

  // One model call per product and language, run in parallel.
  const sets = await Promise.all(
    pairs.map(({ product, language }) => writeCopy(product, language, rules)),
  );

  const variants: Variant[] = pairs.flatMap(({ product, language }, i) =>
    GENERATED_FORMATS.map((format) => {
      const copy = sets[i][format.id];
      const checks = checkCopy(copy, format, product, rules, language);
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
