import { describe, it, expect } from "vitest";
import { generateBadgeSvg, generateFallbackBadgeSvg } from "../../badge";
import type { Grade } from "@/types/scanner";

describe("generateBadgeSvg", () => {
  it("returns valid SVG with correct xmlns", () => {
    const svg = generateBadgeSvg({ grade: "A" });
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("displays the correct grade text", () => {
    const grades: readonly Grade[] = ["A", "B", "C", "D", "F"];
    for (const grade of grades) {
      const svg = generateBadgeSvg({ grade });
      expect(svg).toContain(`Grade ${grade}`);
    }
  });

  it("uses correct color for each grade", () => {
    const expectedColors: Record<Grade, string> = {
      A: "#047857",
      B: "#4d7c0f",
      C: "#a16207",
      D: "#c2410c",
      F: "#b91c1c",
    };

    for (const [grade, color] of Object.entries(expectedColors)) {
      const svg = generateBadgeSvg({ grade: grade as Grade });
      expect(svg).toContain(`fill="${color}"`);
    }
  });

  it("uses default label 'SupaScanner'", () => {
    const svg = generateBadgeSvg({ grade: "A" });
    expect(svg).toContain("SupaScanner");
  });

  it("supports custom label", () => {
    const svg = generateBadgeSvg({ grade: "B", label: "security" });
    expect(svg).toContain("security");
    expect(svg).not.toContain("SupaScanner");
  });

  it("renders flat style with gradient by default", () => {
    const svg = generateBadgeSvg({ grade: "A" });
    expect(svg).toContain("linearGradient");
    expect(svg).toContain('rx="3"');
  });

  it("renders flat-square style without gradient and without border radius", () => {
    const svg = generateBadgeSvg({ grade: "A", style: "flat-square" });
    expect(svg).not.toContain("linearGradient");
    expect(svg).toContain('rx="0"');
  });

  it("escapes XML special characters in label", () => {
    const svg = generateBadgeSvg({ grade: "A", label: '<script>"alert"</script>' });
    expect(svg).toContain("&lt;script&gt;");
    expect(svg).toContain("&quot;alert&quot;");
    expect(svg).not.toContain("<script>");
  });
});

describe("generateFallbackBadgeSvg", () => {
  it("returns valid SVG", () => {
    const svg = generateFallbackBadgeSvg();
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toMatch(/^<svg/);
    expect(svg).toMatch(/<\/svg>$/);
  });

  it("shows 'unknown' as value", () => {
    const svg = generateFallbackBadgeSvg();
    expect(svg).toContain("unknown");
  });

  it("uses grey color for unknown status", () => {
    const svg = generateFallbackBadgeSvg();
    expect(svg).toContain("#9e9e9e");
  });

  it("uses default label", () => {
    const svg = generateFallbackBadgeSvg();
    expect(svg).toContain("SupaScanner");
  });

  it("supports custom label and style", () => {
    const svg = generateFallbackBadgeSvg("custom", "flat-square");
    expect(svg).toContain("custom");
    expect(svg).toContain('rx="0"');
  });
});
