import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./layout";
import type { ScanResultsEmailProps } from "../types";

const gradeColors: Record<string, string> = {
  A: "#16a34a",
  B: "#65a30d",
  C: "#ca8a04",
  D: "#ea580c",
  F: "#dc2626",
};

export function ScanResultsEmail({
  userName,
  grade,
  totalFindings,
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  scanUrl,
  unsubscribeUrl,
}: ScanResultsEmailProps) {
  const gradeColor = gradeColors[grade] ?? "#666666";

  return (
    <EmailLayout
      preview={`Scan complete: Grade ${grade} with ${totalFindings} finding${totalFindings === 1 ? "" : "s"}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={contentStyle}>
        <Heading style={headingStyle}>Scan Results</Heading>
        <Text style={textStyle}>Hi {userName},</Text>
        <Text style={textStyle}>
          Your Supabase security scan is complete. Here is the summary:
        </Text>

        <Section style={gradeContainerStyle}>
          <Text style={{ ...gradeStyle, color: gradeColor }}>{grade}</Text>
          <Text style={gradeLabelStyle}>Security Grade</Text>
        </Section>

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
            looks well-configured. Keep it up!
          </Text>
        )}

        <Section style={buttonContainerStyle}>
          <Button style={buttonStyle} href={scanUrl}>
            View Full Report
          </Button>
        </Section>
      </Section>
    </EmailLayout>
  );
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
