import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Security Leaderboard",
  description:
    "See how Supabase projects rank on security. Browse A-F grades, severity breakdowns, and findings from real scans. Run a free scan to get your project on the leaderboard.",
  keywords: [
    "supabase security leaderboard",
    "supabase security scores",
    "supabase project security ranking",
  ],
  alternates: {
    canonical: `${siteConfig.url}/leaderboard`,
  },
  openGraph: {
    title: "Security Leaderboard | SupaScanner",
    description:
      "See how Supabase projects rank on security. Browse A-F grades, severity breakdowns, and findings from real scans.",
    url: `${siteConfig.url}/leaderboard`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Security Leaderboard | SupaScanner",
    description:
      "See how Supabase projects rank on security. Browse A-F grades, severity breakdowns, and findings from real scans.",
  },
};

export default function LeaderboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
