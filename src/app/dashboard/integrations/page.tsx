import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SlackWebhookManager } from "@/components/slack-webhook-manager";

export default async function IntegrationsPage() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Integrations</h1>
          <p className="text-sand-400 text-sm">
            Connect external services to receive scan notifications.
          </p>
        </div>
        <a
          href="/dashboard"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Back to Dashboard
        </a>
      </header>

      <section className="mb-8">
        <SlackWebhookManager />
      </section>
    </main>
  );
}
