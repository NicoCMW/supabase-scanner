import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Start scanning your Supabase project for free. 3 scans per month on the free plan, unlimited on Pro for $29/month.",
  alternates: {
    canonical: `${siteConfig.url}/pricing`,
  },
  openGraph: {
    title: `Pricing | ${siteConfig.name}`,
    description:
      "Start scanning for free. Upgrade to Pro for unlimited scans.",
    url: `${siteConfig.url}/pricing`,
    type: "website",
  },
};

export default function PricingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
