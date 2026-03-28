export const siteConfig = {
  name: "SupaScanner",
  title: "SupaScanner - Supabase Security Scanner",
  description:
    "Scan your Supabase project for RLS gaps, exposed storage buckets, and auth misconfigurations. Get an A-F security grade with copy-paste SQL fixes in under 40 seconds.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://supabase-scanner.vercel.app",
  ogImage: "/og/default.png",
  locale: "en_US",
  categories: [
    "Security Basics",
    "RLS",
    "Storage",
    "Vibe Coding",
    "Guides",
  ] as const,
} as const;

export type BlogCategory = (typeof siteConfig.categories)[number];
