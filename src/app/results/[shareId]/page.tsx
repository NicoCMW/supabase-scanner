import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { GradeBadge } from "@/components/grade-badge";
import { siteConfig } from "@/lib/seo/config";
import type { Grade } from "@/types/scanner";

interface PageProps {
  params: Promise<{ shareId: string }>;
}

async function getSharedResult(shareId: string) {
  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("shared_results")
    .select("*")
    .eq("share_id", shareId)
    .single();
  return data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { shareId } = await params;
  const result = await getSharedResult(shareId);

  if (!result) {
    return { title: "Not Found" };
  }

  const title = `Security Grade: ${result.grade} | ${siteConfig.name}`;
  const description = `This Supabase project scored a ${result.grade} with ${result.total_findings} finding${result.total_findings !== 1 ? "s" : ""}. Scan your own project for free.`;
  const ogUrl = `${siteConfig.url}/results/${shareId}/opengraph-image`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}/results/${shareId}`,
      siteName: siteConfig.name,
      images: [{ url: ogUrl, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SharedResultPage({ params }: PageProps) {
  const { shareId } = await params;
  const result = await getSharedResult(shareId);

  if (!result) {
    notFound();
  }

  const grade = result.grade as Grade;
  const scanDate = new Date(result.scan_date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-semibold text-sand-900 mb-2">
          Security Grade
        </h1>
        <p className="text-sm text-sand-400 mb-8">
          Scanned on {scanDate}
        </p>

        <div className="flex justify-center mb-8">
          <GradeBadge grade={grade} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-white border border-sand-200 rounded-xl mb-8">
          <StatBox
            label="Critical"
            count={result.critical_count}
            color="text-red-600"
          />
          <StatBox
            label="High"
            count={result.high_count}
            color="text-orange-600"
          />
          <StatBox
            label="Medium"
            count={result.medium_count}
            color="text-amber-600"
          />
          <StatBox
            label="Low"
            count={result.low_count}
            color="text-blue-600"
          />
        </div>

        <p className="text-xs text-sand-400 mb-8">
          {result.total_findings} finding
          {result.total_findings !== 1 ? "s" : ""} detected
        </p>

        <a
          href="/scan"
          className="inline-flex items-center justify-center px-6 py-3 bg-sand-900 text-white text-sm font-medium rounded-lg hover:bg-sand-800 transition-colors"
        >
          Scan your own project
        </a>

        <p className="text-xs text-sand-400 mt-4">
          Free security scan with{" "}
          <a
            href="/"
            className="underline hover:text-sand-600 transition-colors"
          >
            {siteConfig.name}
          </a>
        </p>
      </div>
    </main>
  );
}

function StatBox({
  label,
  count,
  color,
}: {
  readonly label: string;
  readonly count: number;
  readonly color: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-semibold ${color}`}>{count}</div>
      <div className="text-xs text-sand-400">{label}</div>
    </div>
  );
}
