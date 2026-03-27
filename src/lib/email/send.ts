import * as Sentry from "@sentry/nextjs";
import { resend, EMAIL_FROM } from "./client";
import { WelcomeEmail } from "./templates/welcome";
import { ScanResultsEmail } from "./templates/scan-results";
import { WeeklyDigestEmail } from "./templates/weekly-digest";
import type {
  WelcomeEmailProps,
  ScanResultsEmailProps,
  WeeklyDigestEmailProps,
} from "./types";

interface SendResult {
  readonly success: boolean;
  readonly id?: string;
  readonly error?: string;
}

export async function sendWelcomeEmail(
  to: string,
  props: WelcomeEmailProps,
): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: "Welcome to SupaScanner - Secure Your Supabase Project",
      react: WelcomeEmail(props),
    });

    if (error) {
      Sentry.captureMessage("Failed to send welcome email", {
        level: "warning",
        extra: { to, error },
      });
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    Sentry.captureException(err, { extra: { emailType: "welcome", to } });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function sendScanResultsEmail(
  to: string,
  props: ScanResultsEmailProps,
): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Scan Complete: Grade ${props.grade} - ${props.totalFindings} Finding${props.totalFindings === 1 ? "" : "s"}`,
      react: ScanResultsEmail(props),
    });

    if (error) {
      Sentry.captureMessage("Failed to send scan results email", {
        level: "warning",
        extra: { to, error },
      });
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    Sentry.captureException(err, {
      extra: { emailType: "scan_results", to },
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function sendWeeklyDigestEmail(
  to: string,
  props: WeeklyDigestEmailProps,
): Promise<SendResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `Weekly Security Digest - ${props.totalScans} Scan${props.totalScans === 1 ? "" : "s"}, Avg Grade ${props.averageGrade}`,
      react: WeeklyDigestEmail(props),
    });

    if (error) {
      Sentry.captureMessage("Failed to send weekly digest email", {
        level: "warning",
        extra: { to, error },
      });
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    Sentry.captureException(err, {
      extra: { emailType: "weekly_digest", to },
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
