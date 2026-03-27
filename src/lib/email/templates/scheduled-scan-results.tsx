import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./layout";
import type { ScheduledScanEmailProps } from "../types";

const gradeColors: Record<string, string> = {
  A: "#16a34a",
  B: "#65a30d",
  C: "#ca8a04",
  D: "#ea580c",
  F: "#dc2626",
};

export function ScheduledScanResultsEmail({
  userName,
  grade,
  totalFindings,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  newFindings,
  resolvedFindings,
  previousGrade,
  scanUrl,
  dashboardUrl,
  unsubscribeUrl,
}: ScheduledScanEmailProps) {
  const gradeColor = gradeColors[grade] ?? "#666666";
  const hasComparison = previousGrade !== null;
  const gradeImproved =
    hasComparison && gradeRank(grade) > gradeRank(previousGrade!);
  const gradeDeclined =
    hasComparison && gradeRank(grade) < gradeRank(previousGrade!);

  return (
    <EmailLayout
      preview={`Scheduled scan: Grade ${grade}${hasComparison ? ` (was ${previousGrade})` : ""} - ${totalFindings} finding${totalFindings === 1 ? "" : "s"}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={contentStyle}>
        <Heading style={headingStyle}>Scheduled Scan Results</Heading>
        <Text style={textStyle}>Hi {userName},</Text>
        <Text style={textStyle}>
          Your scheduled Supabase security scan has completed. Here is the
          summary:
        </Text>

        <Section style={gradeContainerStyle}>
          <Text style={{ ...gradeStyle, color: gradeColor }}>{grade}</Text>
          <Text style={gradeLabelStyle}>
            Security Grade
            {hasComparison && (
              <span>
                {" "}
                (was{" "}
                <span
                  style={{ color: gradeColors[previousGrade!] ?? "#666666" }}
                >
                  {previousGrade}
                </span>
                )
              </span>
            )}
          </Text>
        </Section>

        {hasComparison && (newFindings > 0 || resolvedFindings > 0) && (
          <Section style={deltaContainerStyle}>
            <Row>
              {newFindings > 0 && (
                <Column style={deltaColumnStyle}>
                  <Text style={{ ...deltaCountStyle, color: "#dc2626" }}>
                    +{newFindings}
                  </Text>
                  <Text style={deltaLabelStyle}>New</Text>
                </Column>
              )}
              {resolvedFindings > 0 && (
                <Column style={deltaColumnStyle}>
                  <Text style={{ ...deltaCountStyle, color: "#16a34a" }}>
                    -{resolvedFindings}
                  </Text>
                  <Text style={deltaLabelStyle}>Resolved</Text>
                </Column>
              )}
              {gradeImproved && (
                <Column style={deltaColumnStyle}>
                  <Text style={{ ...deltaCountStyle, color: "#16a34a" }}>
                    Improved
                  </Text>
                  <Text style={deltaLabelStyle}>Grade</Text>
                </Column>
              )}
              {gradeDeclined && (
                <Column style={deltaColumnStyle}>
                  <Text style={{ ...deltaCountStyle, color: "#ea580c" }}>
                    Declined
                  </Text>
                  <Text style={deltaLabelStyle}>Grade</Text>
                </Column>
              )}
            </Row>
          </Section>
        )}

        <Section style={findingsContainerStyle}>
          <Row>
            <Column style={findingColumnStyle}>
              <Text style={findingCountStyle}>{totalFindings}</Text>
              <Text style={findingLabelStyle}>Total</Text>
            </Column>
            <Column style={findingColumnStyle}>
              <Text style={{ ...findingCountStyle, color: "#dc2626" }}>
                {criticalCount}
              </Text>
              <Text style={findingLabelStyle}>Critical</Text>
            </Column>
            <Column style={findingColumnStyle}>
              <Text style={{ ...findingCountStyle, color: "#ea580c" }}>
                {highCount}
              </Text>
              <Text style={findingLabelStyle}>High</Text>
            </Column>
            <Column style={findingColumnStyle}>
              <Text style={{ ...findingCountStyle, color: "#ca8a04" }}>
                {mediumCount}
              </Text>
              <Text style={findingLabelStyle}>Medium</Text>
            </Column>
            <Column style={findingColumnStyle}>
              <Text style={{ ...findingCountStyle, color: "#65a30d" }}>
                {lowCount}
              </Text>
              <Text style={findingLabelStyle}>Low</Text>
            </Column>
          </Row>
        </Section>

        {totalFindings > 0 ? (
          <Text style={textStyle}>
            We found {totalFindings} security issue
            {totalFindings === 1 ? "" : "s"} in your Supabase project.
            {criticalCount > 0
              ? " You have critical findings that should be addressed immediately."
              : ""}{" "}
            View the full report for copy-paste SQL fixes.
          </Text>
        ) : (
          <Text style={textStyle}>
            Great news! No security issues were found. Your Supabase project
            looks well-configured.
          </Text>
        )}

        <Section style={buttonContainerStyle}>
          <Button style={buttonStyle} href={scanUrl}>
            View Full Report
          </Button>
        </Section>

        <Text style={footerNoteStyle}>
          Manage your scan schedule in your{" "}
          <a href={dashboardUrl} style={linkStyle}>
            dashboard
          </a>
          .
        </Text>
      </Section>
    </EmailLayout>
  );
}

function gradeRank(grade: string): number {
  const ranks: Record<string, number> = { F: 0, D: 1, C: 2, B: 3, A: 4 };
  return ranks[grade] ?? -1;
}

const contentStyle = {
  padding: "0 32px",
};

const headingStyle = {
  fontSize: "24px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "0 0 16px 0",
};

const textStyle = {
  fontSize: "14px",
  color: "#333333",
  lineHeight: "24px",
  margin: "8px 0",
};

const gradeContainerStyle = {
  textAlign: "center" as const,
  padding: "24px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  margin: "16px 0",
};

const gradeStyle = {
  fontSize: "64px",
  fontWeight: "700" as const,
  margin: "0",
  lineHeight: "1",
};

const gradeLabelStyle = {
  fontSize: "14px",
  color: "#666666",
  margin: "8px 0 0 0",
};

const deltaContainerStyle = {
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "8px 0",
  border: "1px dashed #e5e5e5",
};

const deltaColumnStyle = {
  textAlign: "center" as const,
};

const deltaCountStyle = {
  fontSize: "18px",
  fontWeight: "700" as const,
  margin: "0",
};

const deltaLabelStyle = {
  fontSize: "11px",
  color: "#666666",
  margin: "2px 0 0 0",
  textTransform: "uppercase" as const,
};

const findingsContainerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const findingColumnStyle = {
  textAlign: "center" as const,
};

const findingCountStyle = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#1a1a1a",
  margin: "0",
};

const findingLabelStyle = {
  fontSize: "11px",
  color: "#666666",
  margin: "4px 0 0 0",
  textTransform: "uppercase" as const,
};

const buttonContainerStyle = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const buttonStyle = {
  backgroundColor: "#1a1a1a",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "12px 24px",
  textDecoration: "none",
};

const footerNoteStyle = {
  fontSize: "12px",
  color: "#999999",
  textAlign: "center" as const,
  margin: "0 0 8px 0",
};

const linkStyle = {
  color: "#666666",
  textDecoration: "underline",
};
