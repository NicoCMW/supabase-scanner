export { resend, EMAIL_FROM } from "./client";
export { sendWelcomeEmail, sendScanResultsEmail, sendWeeklyDigestEmail } from "./send";
export {
  getOrCreatePreferences,
  getPreferencesByToken,
  updatePreferences,
  updatePreferencesByToken,
  buildUnsubscribeUrl,
} from "./preferences";
export type {
  WelcomeEmailProps,
  ScanResultsEmailProps,
  WeeklyDigestEmailProps,
  FindingSummary,
  EmailPreferences,
} from "./types";
