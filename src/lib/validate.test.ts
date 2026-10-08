import { describe, expect, it } from "vitest";
import { FORMATS } from "./formats";
import { checkCopy, numbersIn, parseProducts } from "./validate";

const square = FORMATS.find((f) => f.id === "square")!;
const leaderboard = FORMATS.find((f) => f.id === "leaderboard")!;
const product = { name: "Rain Jacket", price: "899 kr", description: "Waterproof, 2 colours" };
const rules = { tone: "friendly", bannedWords: ["cheap", "best ever"] };

const failed = (checks: ReturnType<typeof checkCopy>) => checks.filter((c) => !c.ok).map((c) => c.rule);

describe("checkCopy", () => {
  it("passes good copy", () => {
    expect(failed(checkCopy({ headline: "Stay dry for 899 kr", cta: "Shop now" }, square, product, rules))).toEqual([]);
  });

  it("flags a headline that does not fit the format", () => {
    const copy = { headline: "Stay dry all autumn in our new jacket", cta: "Shop" };
    expect(failed(checkCopy(copy, leaderboard, product, rules))).toContain("Headline fits");
  });

  it("flags banned brand words, case-insensitive", () => {
    expect(failed(checkCopy({ headline: "CHEAP jacket", cta: "Buy" }, square, product, rules))).toContain("Brand words");
  });

  it("flags a price the model invented", () => {
    expect(failed(checkCopy({ headline: "Now only 499 kr", cta: "Buy" }, square, product, rules))).toContain("No invented numbers");
  });

  it("allows numbers that come from the product data", () => {
    expect(failed(checkCopy({ headline: "2 colours, 899 kr", cta: "Buy" }, square, product, rules))).not.toContain("No invented numbers");
  });

  it("flags empty copy", () => {
    expect(failed(checkCopy({ headline: "", cta: "Buy" }, square, product, rules))).toContain("Not empty");
  });
});

describe("helpers", () => {
  it("reads numbers with comma or dot", () => {
    expect(numbersIn("Price 899,50 or 12.5")).toEqual(["899.50", "12.5"]);
  });

  it("parses semicolon CSV and skips empty lines", () => {
    expect(parseProducts("Rain Jacket; 899 kr; Waterproof\n\nBoots;1299 kr")).toEqual([
      { name: "Rain Jacket", price: "899 kr", description: "Waterproof" },
      { name: "Boots", price: "1299 kr", description: "" },
    ]);
  });
});
