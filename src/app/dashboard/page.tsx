import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ScanHistory } from "@/components/scan-history";
import { UsageBanner } from "@/components/usage-banner";
import type { Grade } from "@/types/scanner";

interface ScanJobRow {
  readonly id: string;
  readonly supabase_url: string;
  readonly status: string;
  readonly grade: Grade | null;
  readonly total_findings: number;
  readonly duration_ms: number | null;
  readonly created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scanJobs } = await supabase
    .from("scan_jobs")
    .select(
      "id, supabase_url, status, grade, total_findings, duration_ms, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="min-h-screen p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Dashboard</h1>
          <p className="text-sand-400 text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-4">
          <a
            href="/scan"
            className="px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            New scan
          </a>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <UsageBanner />
      <ScanHistory scanJobs={(scanJobs ?? []) as readonly ScanJobRow[]} />
    </main>
  );
}
