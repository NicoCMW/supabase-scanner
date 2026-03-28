import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { WidgetConfigurator } from "@/components/widget-configurator";
import type { Grade } from "@/types/scanner";

interface SharedResultRow {
  readonly share_id: string;
  readonly grade: Grade;
  readonly scan_date: string;
  readonly total_findings: number;
}

export default async function WidgetPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: sharedResults } = await supabase
    .from("shared_results")
    .select("share_id, grade, scan_date, total_findings")
    .eq("user_id", user.id)
    .order("scan_date", { ascending: false })
    .limit(20);

  const results = (sharedResults ?? []) as readonly SharedResultRow[];

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Get Widget</h1>
          <p className="text-sand-400 text-sm">
            Embed your security score on any website
          </p>
        </div>
        <a
          href="/dashboard"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Back to Dashboard
        </a>
      </header>

      {results.length === 0 ? (
        <div className="border border-sand-200 rounded-xl p-8 text-center">
          <p className="text-sand-500 mb-2">No shared scans yet</p>
          <p className="text-sand-400 text-sm mb-4">
            Share a scan result first, then come back here to get the embed
            code.
          </p>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      ) : (
        <WidgetConfigurator sharedResults={results} />
      )}
    </main>
  );
}
