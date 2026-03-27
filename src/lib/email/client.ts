import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? "SupaScanner <noreply@supascanner.com>";

export { resend };
