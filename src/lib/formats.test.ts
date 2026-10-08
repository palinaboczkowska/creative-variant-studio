import { describe, expect, it } from "vitest";
import { customFormat, FORMATS, resolveFormat } from "./formats";

describe("customFormat", () => {
  it("gives standard sizes limits close to the hand-set ones", () => {
    for (const f of FORMATS) {
      const c = customFormat(f.width, f.height);
      expect(Math.abs(c.maxHeadline - f.maxHeadline)).toBeLessThanOrEqual(6);
    }
  });

  it("gives bigger banners room for more text", () => {
    expect(customFormat(600, 500).maxHeadline).toBeGreaterThan(customFormat(300, 250).maxHeadline);
  });

  it("clamps sizes outside the allowed range", () => {
    const f = customFormat(0, 99999);
    expect(f.width).toBe(50);
    expect(f.height).toBe(4000);
  });

  it("resolves custom and standard formats", () => {
    expect(resolveFormat("custom", { width: 320, height: 50 }).label).toBe("Custom 320×50");
    expect(resolveFormat("square").width).toBe(1080);
  });
});
