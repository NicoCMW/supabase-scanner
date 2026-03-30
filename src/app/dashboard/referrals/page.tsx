import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { ReferralDashboard } from "@/components/referral-dashboard";

export default async function ReferralsPage() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-sand-900">Referrals</h1>
          <p className="text-sand-400 text-sm">
            Give 1 month Pro, get 1 month Pro
          </p>
        </div>
        <a
          href="/dashboard"
          className="text-sm text-sand-400 hover:text-sand-900 transition-colors"
        >
          Back to Dashboard
        </a>
      </header>

      <ReferralDashboard />

      <div className="mt-8 p-4 rounded-lg border border-sand-200 bg-white">
        <h2 className="text-sm font-semibold text-sand-900 mb-2">
          How it works
        </h2>
        <ol className="space-y-2 text-sm text-sand-500">
          <li className="flex gap-2">
            <span className="text-sand-900 font-medium">1.</span>
            Share your unique referral link with a friend or colleague.
          </li>
          <li className="flex gap-2">
            <span className="text-sand-900 font-medium">2.</span>
            They sign up for SupaScanner using your link.
          </li>
          <li className="flex gap-2">
            <span className="text-sand-900 font-medium">3.</span>
            When they upgrade to Pro, you both get 1 month of Pro free.
          </li>
        </ol>
      </div>
    </main>
  );
}
