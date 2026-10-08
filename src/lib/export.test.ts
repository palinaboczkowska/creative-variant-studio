import { describe, expect, it } from "vitest";
import { approvedToCsv } from "./export";
import { DEFAULT_STYLE } from "./style";
import type { Variant } from "./types";

function variant(overrides: Partial<Variant>): Variant {
  return {
    id: "1",
    product: { name: "Rain Jacket", price: "899 kr", description: "" },
    language: "English",
    format: "square",
    copy: { headline: "Rain Jacket, 899 kr", cta: "Shop now" },
    checks: [],
    status: "approved",
    ...overrides,
  };
}

describe("approvedToCsv", () => {
  it("exports only approved variants", () => {
    const csv = approvedToCsv([variant({}), variant({ id: "2", status: "needs-review" })], DEFAULT_STYLE);
    expect(csv.trim().split("\n")).toHaveLength(2);
  });

  it("quotes cells with commas and quotes", () => {
    const csv = approvedToCsv([variant({ copy: { headline: 'Stay dry, say "hi"', cta: "Go" } })], DEFAULT_STYLE);
    expect(csv).toContain('"Stay dry, say ""hi"""');
  });

  it("uses the variant's own format and style changes", () => {
    const csv = approvedToCsv([variant({ format: "skyscraper", style: { radius: 20, ctaShape: "pill" } })], DEFAULT_STYLE);
    const row = csv.trim().split("\n")[1].split(",");
    expect(row.slice(3, 6)).toEqual(["skyscraper", "160", "600"]);
    expect(row).toContain("pill");
    expect(row).toContain("20");
  });
});
