import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

interface EmailLayoutProps {
  readonly preview: string;
  readonly children: ReactNode;
  readonly unsubscribeUrl: string;
}

export function EmailLayout({
  preview,
  children,
  unsubscribeUrl,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoStyle}>SupaScanner</Text>
          </Section>
          {children}
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>
              SupaScanner - Supabase Security Scanner
            </Text>
            <Text style={footerTextStyle}>
              <Link href={unsubscribeUrl} style={unsubscribeLinkStyle}>
                Unsubscribe
              </Link>{" "}
              |{" "}
              <Link
                href="https://supabase-scanner.vercel.app/dashboard"
                style={unsubscribeLinkStyle}
              >
                Dashboard
              </Link>
            </Text>
            <Text style={addressStyle}>
              SupaScanner Inc. | 123 Security Lane | San Francisco, CA 94102
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f6f6f6",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const containerStyle = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "580px",
};

const headerStyle = {
  padding: "24px 32px",
};

const logoStyle = {
  fontSize: "24px",
  fontWeight: "700" as const,
  color: "#1a1a1a",
  margin: "0",
};

const hrStyle = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footerStyle = {
  padding: "0 32px",
};

const footerTextStyle = {
  fontSize: "12px",
  color: "#666666",
  margin: "4px 0",
};

const unsubscribeLinkStyle = {
  color: "#666666",
  textDecoration: "underline",
};

const addressStyle = {
  fontSize: "11px",
  color: "#999999",
  margin: "16px 0 0 0",
};
