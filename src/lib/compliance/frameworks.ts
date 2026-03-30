import type { Severity } from "@/types/scanner";

export type ComplianceFramework = "soc2" | "hipaa";

export interface ComplianceControl {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly framework: ComplianceFramework;
}

export type ComplianceStatus = "pass" | "fail" | "warning" | "not_assessed";

export interface ComplianceCheckResult {
  readonly control: ComplianceControl;
  readonly status: ComplianceStatus;
  readonly findings: readonly MappedFinding[];
}

export interface MappedFinding {
  readonly title: string;
  readonly severity: Severity;
  readonly category: string;
  readonly resource: string;
  readonly description: string;
  readonly remediation: string;
}

// -- SOC 2 Trust Service Criteria --

const SOC2_CONTROLS: readonly ComplianceControl[] = [
  {
    id: "CC6.1",
    name: "Logical Access Security",
    description:
      "The entity implements logical access security software, infrastructure, and architectures over protected information assets to protect them from security events.",
    framework: "soc2",
  },
  {
    id: "CC6.2",
    name: "User Registration and Authorization",
    description:
      "Prior to issuing system credentials and granting system access, the entity registers and authorizes new internal and external users.",
    framework: "soc2",
  },
  {
    id: "CC6.3",
    name: "Access Management",
    description:
      "The entity authorizes, modifies, or removes access to data, software, functions, and other protected information assets based on roles and responsibilities.",
    framework: "soc2",
  },
  {
    id: "CC6.6",
    name: "External Threat Protection",
    description:
      "The entity implements logical access security measures to protect against threats from sources outside its system boundaries.",
    framework: "soc2",
  },
  {
    id: "CC6.7",
    name: "Information Transmission Control",
    description:
      "The entity restricts the transmission, movement, and removal of information to authorized internal and external users and processes.",
    framework: "soc2",
  },
  {
    id: "CC6.8",
    name: "Unauthorized Software Prevention",
    description:
      "The entity implements controls to prevent or detect and act upon the introduction of unauthorized or malicious software.",
    framework: "soc2",
  },
  {
    id: "CC7.1",
    name: "Configuration Change Detection",
    description:
      "To meet its objectives, the entity uses detection and monitoring procedures to identify changes to configurations that result in the introduction of new vulnerabilities.",
    framework: "soc2",
  },
  {
    id: "CC7.2",
    name: "Anomaly Monitoring",
    description:
      "The entity monitors system components and the operation of those components for anomalies that are indicative of malicious acts, natural disasters, and errors.",
    framework: "soc2",
  },
  {
    id: "CC8.1",
    name: "Change Management",
    description:
      "The entity authorizes, designs, develops or acquires, configures, documents, tests, approves, and implements changes to infrastructure, data, software, and procedures.",
    framework: "soc2",
  },
];

// -- HIPAA Security Rule --

const HIPAA_CONTROLS: readonly ComplianceControl[] = [
  {
    id: "164.312(a)(1)",
    name: "Access Control",
    description:
      "Implement technical policies and procedures for electronic information systems that maintain ePHI to allow access only to authorized persons or software programs.",
    framework: "hipaa",
  },
  {
    id: "164.312(a)(2)(i)",
    name: "Unique User Identification",
    description:
      "Assign a unique name and/or number for identifying and tracking user identity.",
    framework: "hipaa",
  },
  {
    id: "164.312(a)(2)(iii)",
    name: "Automatic Logoff",
    description:
      "Implement electronic procedures that terminate an electronic session after a predetermined time of inactivity.",
    framework: "hipaa",
  },
  {
    id: "164.312(b)",
    name: "Audit Controls",
    description:
      "Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use ePHI.",
    framework: "hipaa",
  },
  {
    id: "164.312(c)(1)",
    name: "Integrity Controls",
    description:
      "Implement policies and procedures to protect ePHI from improper alteration or destruction.",
    framework: "hipaa",
  },
  {
    id: "164.312(d)",
    name: "Person or Entity Authentication",
    description:
      "Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.",
    framework: "hipaa",
  },
  {
    id: "164.312(e)(1)",
    name: "Transmission Security",
    description:
      "Implement technical security measures to guard against unauthorized access to ePHI that is being transmitted over an electronic communications network.",
    framework: "hipaa",
  },
  {
    id: "164.308(a)(1)",
    name: "Security Management Process",
    description:
      "Implement policies and procedures to prevent, detect, contain, and correct security violations.",
    framework: "hipaa",
  },
  {
    id: "164.308(a)(3)",
    name: "Workforce Security",
    description:
      "Implement policies and procedures to ensure that all members of its workforce have appropriate access to ePHI.",
    framework: "hipaa",
  },
  {
    id: "164.308(a)(4)",
    name: "Information Access Management",
    description:
      "Implement policies and procedures for authorizing access to ePHI.",
    framework: "hipaa",
  },
];

interface FindingMatcher {
  readonly pattern: RegExp;
  readonly soc2: readonly string[];
  readonly hipaa: readonly string[];
}

const FINDING_MATCHERS: readonly FindingMatcher[] = [
  // RLS - public read with data
  {
    pattern: /publicly readable with data/i,
    soc2: ["CC6.1", "CC6.3", "CC6.6"],
    hipaa: ["164.312(a)(1)", "164.312(c)(1)", "164.308(a)(4)"],
  },
  // RLS - public access (empty)
  {
    pattern: /publicly accessible \(empty\)/i,
    soc2: ["CC6.1", "CC6.3"],
    hipaa: ["164.312(a)(1)", "164.308(a)(4)"],
  },
  // RLS - anonymous INSERT
  {
    pattern: /allows anonymous INSERT/i,
    soc2: ["CC6.1", "CC6.3", "CC6.6"],
    hipaa: ["164.312(a)(1)", "164.312(c)(1)"],
  },
  // Storage - bucket listable
  {
    pattern: /is listable/i,
    soc2: ["CC6.1", "CC6.3"],
    hipaa: ["164.312(a)(1)", "164.312(c)(1)"],
  },
  // Storage - anonymous uploads
  {
    pattern: /allows anonymous uploads|may allow anonymous uploads/i,
    soc2: ["CC6.1", "CC6.6", "CC6.8"],
    hipaa: ["164.312(a)(1)", "164.312(c)(1)"],
  },
  // Storage - anonymous deletes
  {
    pattern: /allows anonymous deletes|may allow anonymous deletes/i,
    soc2: ["CC6.1", "CC6.3"],
    hipaa: ["164.312(a)(1)", "164.312(c)(1)"],
  },
  // Storage - public bucket
  {
    pattern: /is marked public/i,
    soc2: ["CC6.1", "CC6.3"],
    hipaa: ["164.312(a)(1)"],
  },
  // Storage - sensitive file types
  {
    pattern: /contains sensitive file types/i,
    soc2: ["CC6.1", "CC6.7"],
    hipaa: ["164.312(a)(1)", "164.312(e)(1)"],
  },
  // Storage - objects RLS bypass
  {
    pattern: /storage\.objects.*accessible via REST/i,
    soc2: ["CC6.1", "CC6.6"],
    hipaa: ["164.312(a)(1)", "164.312(c)(1)"],
  },
  // Storage - no file size limit
  {
    pattern: /no file size limit/i,
    soc2: ["CC6.8"],
    hipaa: ["164.308(a)(1)"],
  },
  // Storage - no MIME restrictions
  {
    pattern: /no MIME type restrictions/i,
    soc2: ["CC6.8"],
    hipaa: ["164.308(a)(1)"],
  },
  // Storage - anonymous signed URLs
  {
    pattern: /anonymous signed URL/i,
    soc2: ["CC6.1", "CC6.3"],
    hipaa: ["164.312(a)(1)"],
  },
  // Auth - email confirmation disabled
  {
    pattern: /email confirmation is disabled/i,
    soc2: ["CC6.2"],
    hipaa: ["164.312(d)"],
  },
  // Auth - user enumeration
  {
    pattern: /user enumeration/i,
    soc2: ["CC6.6"],
    hipaa: ["164.312(d)"],
  },
  // Auth - settings exposed
  {
    pattern: /auth configuration is publicly readable/i,
    soc2: ["CC7.1"],
    hipaa: ["164.308(a)(1)"],
  },
  // Auth - weak password
  {
    pattern: /weak password policy|password minimum length/i,
    soc2: ["CC6.1", "CC6.2"],
    hipaa: ["164.312(d)"],
  },
  // Auth - MFA disabled
  {
    pattern: /multi-factor authentication is disabled/i,
    soc2: ["CC6.1"],
    hipaa: ["164.312(d)"],
  },
  // Auth - many OAuth providers
  {
    pattern: /large number of OAuth providers/i,
    soc2: ["CC6.6"],
    hipaa: ["164.312(a)(1)"],
  },
  // Auth - invalid token accepted
  {
    pattern: /accepted invalid refresh token/i,
    soc2: ["CC6.1", "CC6.6"],
    hipaa: ["164.312(d)", "164.312(a)(1)"],
  },
  // Auth - no rate limiting
  {
    pattern: /lack rate limiting/i,
    soc2: ["CC6.6"],
    hipaa: ["164.312(a)(1)"],
  },
  // Auth - long JWT expiry
  {
    pattern: /JWT tokens have extremely long expiry/i,
    soc2: ["CC6.1"],
    hipaa: ["164.312(a)(2)(iii)"],
  },
  // Edge Functions - authentication bypass
  {
    pattern: /accessible without authentication/i,
    soc2: ["CC6.1", "CC6.2", "CC6.6"],
    hipaa: ["164.312(a)(1)", "164.312(d)"],
  },
  // Edge Functions - wildcard CORS
  {
    pattern: /wildcard CORS origin/i,
    soc2: ["CC6.6", "CC6.7"],
    hipaa: ["164.312(e)(1)", "164.308(a)(1)"],
  },
  // Edge Functions - secret leakage
  {
    pattern: /expose secrets in response/i,
    soc2: ["CC6.1", "CC6.7"],
    hipaa: ["164.312(a)(1)", "164.312(e)(1)"],
  },
  // Edge Functions - anonymous invocation
  {
    pattern: /invocable with anonymous key/i,
    soc2: ["CC6.1", "CC6.3"],
    hipaa: ["164.312(a)(1)", "164.308(a)(4)"],
  },
  // Edge Functions - rate limiting
  {
    pattern: /Edge Function.*lack rate limiting/i,
    soc2: ["CC6.6"],
    hipaa: ["164.312(a)(1)"],
  },
  // Edge Functions - verbose errors
  {
    pattern: /exposes internal details in error/i,
    soc2: ["CC6.6", "CC7.1"],
    hipaa: ["164.308(a)(1)"],
  },
];

function getControlsForFramework(
  framework: ComplianceFramework,
): readonly ComplianceControl[] {
  return framework === "soc2" ? SOC2_CONTROLS : HIPAA_CONTROLS;
}

function getMatchedControlIds(
  findingTitle: string,
  framework: ComplianceFramework,
): readonly string[] {
  for (const matcher of FINDING_MATCHERS) {
    if (matcher.pattern.test(findingTitle)) {
      return framework === "soc2" ? matcher.soc2 : matcher.hipaa;
    }
  }
  // Default mapping for unmatched findings by category
  if (framework === "soc2") return ["CC6.1"];
  return ["164.312(a)(1)"];
}

export function mapFindingsToFramework(
  findings: readonly MappedFinding[],
  framework: ComplianceFramework,
): readonly ComplianceCheckResult[] {
  const controls = getControlsForFramework(framework);
  const controlFindingsMap = new Map<string, MappedFinding[]>();

  for (const control of controls) {
    controlFindingsMap.set(control.id, []);
  }

  for (const finding of findings) {
    const controlIds = getMatchedControlIds(finding.title, framework);
    for (const controlId of controlIds) {
      const existing = controlFindingsMap.get(controlId);
      if (existing) {
        existing.push(finding);
      }
    }
  }

  return controls.map((control) => {
    const mappedFindings = controlFindingsMap.get(control.id) ?? [];
    const hasCritical = mappedFindings.some((f) => f.severity === "critical");
    const hasHigh = mappedFindings.some((f) => f.severity === "high");

    let status: ComplianceStatus;
    if (mappedFindings.length === 0) {
      status = "pass";
    } else if (hasCritical || hasHigh) {
      status = "fail";
    } else {
      status = "warning";
    }

    return { control, status, findings: mappedFindings };
  });
}

export function getFrameworkSummary(results: readonly ComplianceCheckResult[]): {
  readonly passed: number;
  readonly failed: number;
  readonly warnings: number;
  readonly total: number;
  readonly readinessPercent: number;
} {
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warnings = results.filter((r) => r.status === "warning").length;
  const total = results.length;
  const readinessPercent =
    total > 0 ? Math.round((passed / total) * 100) : 0;

  return { passed, failed, warnings, total, readinessPercent };
}
