import { describe, it, expect } from "vitest";
import { computeGrade, createFinding } from "../utils";
import type { Finding } from "@/types/scanner";

describe("computeGrade", () => {
  it("returns A when there are no findings", () => {
    expect(computeGrade([])).toBe("A");
  });

  it("returns A for low-severity findings under threshold", () => {
    const findings = [
      makeFinding("low"),
      makeFinding("low"),
      makeFinding("low"),
      makeFinding("low"),
    ];
    // 4 * 1 = 4, which is < 5
    expect(computeGrade(findings)).toBe("A");
  });

  it("returns B for score between 5 and 9", () => {
    const findings = [makeFinding("medium"), makeFinding("low")];
    // 4 + 1 = 5
    expect(computeGrade(findings)).toBe("B");
  });

  it("returns C for score between 10 and 19", () => {
    const findings = [makeFinding("high"), makeFinding("medium")];
    // 7 + 4 = 11
    expect(computeGrade(findings)).toBe("C");
  });

  it("returns D for score between 20 and 29", () => {
    const findings = [
      makeFinding("critical"),
      makeFinding("critical"),
    ];
    // 10 + 10 = 20
    expect(computeGrade(findings)).toBe("D");
  });

  it("returns F for score >= 30", () => {
    const findings = [
      makeFinding("critical"),
      makeFinding("critical"),
      makeFinding("critical"),
    ];
    // 10 + 10 + 10 = 30
    expect(computeGrade(findings)).toBe("F");
  });
});

describe("createFinding", () => {
  it("creates a finding with a unique id", () => {
    const finding = createFinding({
      title: "Test finding",
      description: "Test description",
      severity: "high",
      category: "rls",
      resource: "test",
      details: {},
      remediation: "Fix it",
    });

    expect(finding.id).toBeDefined();
    expect(finding.id.length).toBeGreaterThan(0);
    expect(finding.title).toBe("Test finding");
    expect(finding.severity).toBe("high");
  });

  it("creates findings with unique ids", () => {
    const f1 = createFinding({
      title: "Finding 1",
      description: "d",
      severity: "low",
      category: "auth",
      resource: "r",
      details: {},
      remediation: "r",
    });
    const f2 = createFinding({
      title: "Finding 2",
      description: "d",
      severity: "low",
      category: "auth",
      resource: "r",
      details: {},
      remediation: "r",
    });

    expect(f1.id).not.toBe(f2.id);
  });
});

function makeFinding(severity: Finding["severity"]): Finding {
  return createFinding({
    title: `Test ${severity}`,
    description: "test",
    severity,
    category: "rls",
    resource: "test",
    details: {},
    remediation: "test",
  });
}
