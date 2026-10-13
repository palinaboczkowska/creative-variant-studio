import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { GENERATED_FORMATS } from "./formats";
import type { BrandRules, Copy, GeneratedFormatId, Product } from "./types";
import { bannedWordsFor } from "./validate";

const CopySchema = z.object({ headline: z.string(), cta: z.string() });
const VariantSetSchema = z.object({
  square: CopySchema,
  leaderboard: CopySchema,
  story: CopySchema,
});
export type VariantSet = Record<GeneratedFormatId, Copy>;

export const MODEL = "claude-opus-5";

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

// The model writes copy for every format in one call. It is told the
// limits, but the deterministic checks in validate.ts decide what passes.
export async function writeCopy(
  product: Product,
  language: string,
  rules: BrandRules,
): Promise<VariantSet> {
  if (!hasApiKey()) return demoCopy(product, language);

  const client = new Anthropic();
  const limits = GENERATED_FORMATS.map(
    (f) =>
      `- ${f.id} (${f.label}): headline max ${f.maxHeadline} characters, CTA max ${f.maxCta} characters`,
  ).join("\n");

  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system:
      "You write short display-ad copy for a creative team. Use only facts from the product data. " +
      "Never invent prices, discounts or claims. Write in the requested language.",
    messages: [
      {
        role: "user",
        content:
          `Product: ${product.name}\nPrice: ${product.price}\nDetails: ${product.description || "none"}\n` +
          `Language: ${language}\nTone: ${rules.tone}\nAvoid these words: ${bannedWordsFor(rules, language).join(", ") || "none"}\n\n` +
          `Write one headline and one call to action for each format:\n${limits}`,
      },
    ],
    output_config: { effort: "low", format: zodOutputFormat(VariantSetSchema) },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(
      `No copy returned for ${product.name} (${language}): ${response.stop_reason}`,
    );
  }
  return response.parsed_output;
}

const TranslationsSchema = z.object({
  translations: z.array(
    z.object({ language: z.string(), words: z.array(z.string()) }),
  ),
});

// Brand rules are often written in one language. Before writing copy, Claude
// translates the banned words into every selected language, with common word
// forms, so the checks catch "billig" when "cheap" is banned.
export async function translateBannedWords(
  words: string[],
  languages: string[],
): Promise<Record<string, string[]>> {
  if (!hasApiKey() || words.length === 0) return {};

  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 2000,
    system:
      "You help a creative team enforce brand rules. Translate banned marketing words and phrases. " +
      "For each language, give the natural translations a copywriter could use, including common forms " +
      "(for example plural, definite and neuter forms). Use lowercase. Do not add unrelated words.",
    messages: [
      {
        role: "user",
        content: `Banned words: ${words.join(", ")}
Languages: ${languages.join(", ")}`,
      },
    ],
    output_config: {
      effort: "low",
      format: zodOutputFormat(TranslationsSchema),
    },
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) return {};
  const result: Record<string, string[]> = {};
  for (const { language, words: translated } of response.parsed_output
    .translations) {
    if (languages.includes(language))
      result[language] = translated
        .map((w) => w.trim().toLowerCase())
        .filter(Boolean);
  }
  return result;
}

// Lets the app run without an API key, e.g. in CI or a first local run.
function demoCopy(product: Product, language: string): VariantSet {
  const tag = language.slice(0, 2).toUpperCase();
  return {
    square: {
      headline: `${product.name} for ${product.price}`,
      cta: `Shop now (${tag})`,
    },
    leaderboard: {
      headline: `${product.name}, ${product.price}`,
      cta: "Shop now",
    },
    story: { headline: `Meet the new ${product.name}`, cta: "Swipe to shop" },
  };
}
