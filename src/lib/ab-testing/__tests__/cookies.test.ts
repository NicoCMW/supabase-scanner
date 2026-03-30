import { describe, it, expect } from "vitest";
import {
  parseAssignments,
  serializeAssignments,
  assignMissingExperiments,
} from "../cookies";

describe("parseAssignments", () => {
  it("parses a single assignment", () => {
    expect(parseAssignments("hero_headline:security")).toEqual({
      hero_headline: "security",
    });
  });

  it("parses multiple assignments", () => {
    const result = parseAssignments(
      "hero_headline:security,cta_text:scan_now_free,social_proof_placement:above_fold",
    );
    expect(result).toEqual({
      hero_headline: "security",
      cta_text: "scan_now_free",
      social_proof_placement: "above_fold",
    });
  });

  it("returns empty object for empty string", () => {
    expect(parseAssignments("")).toEqual({});
  });

  it("ignores malformed entries", () => {
    expect(parseAssignments("valid:value,badentry")).toEqual({
      valid: "value",
    });
  });
});

describe("serializeAssignments", () => {
  it("serializes assignments to cookie format", () => {
    const result = serializeAssignments({
      hero_headline: "speed",
      cta_text: "check_security",
    });
    expect(result).toBe("hero_headline:speed,cta_text:check_security");
  });

  it("returns empty string for empty assignments", () => {
    expect(serializeAssignments({})).toBe("");
  });
});

describe("assignMissingExperiments", () => {
  it("assigns all experiments when empty", () => {
    const result = assignMissingExperiments({});
    expect(Object.keys(result)).toHaveLength(3);
    expect(result).toHaveProperty("hero_headline");
    expect(result).toHaveProperty("cta_text");
    expect(result).toHaveProperty("social_proof_placement");
  });

  it("preserves existing assignments", () => {
    const result = assignMissingExperiments({
      hero_headline: "compliance",
    });
    expect(result.hero_headline).toBe("compliance");
    expect(result).toHaveProperty("cta_text");
    expect(result).toHaveProperty("social_proof_placement");
  });

  it("assigns valid variant ids", () => {
    const result = assignMissingExperiments({});
    expect(["security", "speed", "compliance"]).toContain(
      result.hero_headline,
    );
    expect(["scan_now_free", "check_security", "get_score"]).toContain(
      result.cta_text,
    );
    expect(["above_fold", "below_scanner", "sidebar"]).toContain(
      result.social_proof_placement,
    );
  });

  it("roundtrips through serialize and parse", () => {
    const original = assignMissingExperiments({});
    const serialized = serializeAssignments(original);
    const parsed = parseAssignments(serialized);
    expect(parsed).toEqual(original);
  });
});
