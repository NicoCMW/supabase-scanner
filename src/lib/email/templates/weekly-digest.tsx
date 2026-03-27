import {
  Button,
  Column,
  Heading,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./layout";
import type { WeeklyDigestEmailProps } from "../types";

const severityColors: Record<string, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#ca8a04",
  low: "#65a30d",
};

export function WeeklyDigestEmail({
  userName,
  totalScans,
  averageGrade,
  newFindings,
  resolvedFindings,
  topFindings,
  dashboardUrl,
  unsubscribeUrl,
}: WeeklyDigestEmailProps) {
  return (
    <EmailLayout
      preview={`Weekly digest: ${totalScans} scan${totalScans === 1 ? "" : "s"}, avg grade ${averageGrade}`}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={contentStyle}>
        <Heading style={headingStyle}>Weekly Security Digest</Heading>
        <Text style={textStyle}>Hi {userName},</Text>
        <Text style={textStyle}>
          Here is your weekly security summary for your Supabase projects:
        </Text>

        <Section style={statsContainerStyle}>
          <Row>
            <Column style={statColumnStyle}>
              <Text style={statCountStyle}>{totalScans}</Text>
              <Text style={statLabelStyle}>
                Scan{totalScans === 1 ? "" : "s"}
              </Text>
            </Column>
            <Column style={statColumnStyle}>
              <Text style={statCountStyle}>{averageGrade}</Text>
              <Text style={statLabelStyle}>Avg Grade</Text>
            </Column>
            <Column style={statColumnStyle}>
              <Text style={{ ...statCountStyle, color: "#dc2626" }}>
                {newFindings}
              </Text>
              <Text style={statLabelStyle}>New Issues</Text>
            </Column>
            <Column style={statColumnStyle}>
              <Text style={{ ...statCountStyle, color: "#16a34a" }}>
                {resolvedFindings}
              </Text>
              <Text style={statLabelStyle}>Resolved</Text>
            </Column>
          </Row>
        </Section>

        {topFindings.length > 0 && (
          <>
            <Heading as="h3" style={subheadingStyle}>
              Top Findings This Week
            </Heading>
            {topFindings.map((finding, index) => (
              <Section key={index} style={findingRowStyle}>
                <Text style={findingTitleStyle}>
                  <span
                    style={{
                      color: severityColors[finding.severity] ?? "#666",
                      fontWeight: "600",
                    }}
                  >
                    [{finding.severity.toUpperCase()}]
                  </span>{" "}
                  {finding.title}
                </Text>
                <Text style={findingCategoryStyle}>{finding.category}</Text>
              </Section>
            ))}
          </>
        )}

        {totalScans === 0 && (
          <Text style={textStyle}>
            You did not run any scans this week. Regular scanning helps catch
            security regressions early.
          </Text>
        )}

        <Section style={buttonContainerStyle}>
          <Button style={buttonStyle} href={dashboardUrl}>
            Go to Dashboard
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

const subheadingStyle = {
  fontSize: "16px",
  fontWeight: "600" as const,
  color: "#1a1a1a",
  margin: "24px 0 8px 0",
};

const textStyle = {
  fontSize: "14px",
  color: "#333333",
  lineHeight: "24px",
  margin: "8px 0",
};

const statsContainerStyle = {
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const statColumnStyle = {
  textAlign: "center" as const,
};

const statCountStyle = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#1a1a1a",
  margin: "0",
};

const statLabelStyle = {
  fontSize: "11px",
  color: "#666666",
  margin: "4px 0 0 0",
  textTransform: "uppercase" as const,
};

const findingRowStyle = {
  padding: "8px 12px",
  backgroundColor: "#ffffff",
  borderRadius: "4px",
  margin: "4px 0",
};

const findingTitleStyle = {
  fontSize: "13px",
  color: "#333333",
  margin: "0",
};

const findingCategoryStyle = {
  fontSize: "11px",
  color: "#999999",
  margin: "2px 0 0 0",
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
