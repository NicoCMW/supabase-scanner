import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Scan Your Supabase Project",
  description:
    "Run a free security scan on your Supabase project. Detect RLS gaps, exposed storage buckets, and auth misconfigurations in under 40 seconds. Get an A-F grade with copy-paste SQL fixes.",
  keywords: [
    "supabase security scanner",
    "supabase security audit",
    "supabase RLS checker",
    "supabase vulnerability scanner",
  ],
  alternates: {
    canonical: `${siteConfig.url}/scan`,
  },
  openGraph: {
    title: "Scan Your Supabase Project | SupaScanner",
    description:
      "Free security scan for your Supabase project. Detect RLS gaps, exposed storage buckets, and auth misconfigurations in under 40 seconds.",
    url: `${siteConfig.url}/scan`,
    type: "website",
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: "Scan Your Supabase Project | SupaScanner",
    description:
      "Free security scan for your Supabase project. Detect RLS gaps, exposed storage buckets, and auth misconfigurations in under 40 seconds.",
  },
};

export default function ScanLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
