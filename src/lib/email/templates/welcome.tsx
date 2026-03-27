import {
  Button,
  Heading,
  Link,
  Section,
  Text,
} from "@react-email/components";
import { EmailLayout } from "./layout";
import type { WelcomeEmailProps } from "../types";

export function WelcomeEmail({ userName, unsubscribeUrl }: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview="Welcome to SupaScanner - secure your Supabase project in 40 seconds"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Section style={contentStyle}>
        <Heading style={headingStyle}>Welcome to SupaScanner</Heading>
        <Text style={textStyle}>Hi {userName},</Text>
        <Text style={textStyle}>
          You are now set up to scan your Supabase projects for security
          vulnerabilities. SupaScanner checks for RLS gaps, exposed storage
          buckets, and auth misconfigurations -- all in under 40 seconds.
        </Text>
        <Heading as="h3" style={subheadingStyle}>
          Quick Start Guide
        </Heading>
        <Text style={textStyle}>
          1. Go to your{" "}
          <Link href="https://supascanner.com/dashboard" style={linkStyle}>
            Dashboard
          </Link>
        </Text>
        <Text style={textStyle}>
          2. Enter your Supabase project URL and anon key
        </Text>
        <Text style={textStyle}>
          3. Click "Run Scan" and get your A-F security grade
        </Text>
        <Text style={textStyle}>
          4. Fix issues using the provided SQL remediation snippets
        </Text>
        <Section style={buttonContainerStyle}>
          <Button style={buttonStyle} href="https://supascanner.com/dashboard">
            Run Your First Scan
          </Button>
        </Section>
        <Text style={tipStyle}>
          Tip: Your free plan includes 3 scans per month. Need more?{" "}
          <Link href="https://supascanner.com/pricing" style={linkStyle}>
            Check out Pro
          </Link>
          .
        </Text>
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
  margin: "4px 0",
};

const linkStyle = {
  color: "#2563eb",
  textDecoration: "underline",
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

const tipStyle = {
  fontSize: "13px",
  color: "#666666",
  lineHeight: "20px",
  margin: "16px 0 0 0",
  fontStyle: "italic" as const,
};
