import { createSupabaseServer } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-4">Supabase Security Scanner</h1>
      <p className="text-gray-400 text-lg mb-8 max-w-xl text-center">
        Scan your Supabase project for common security misconfigurations.
        Check RLS policies, storage permissions, and auth settings in seconds.
      </p>
      <div className="flex gap-4">
        <a
          href="/login"
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
        >
          Get Started
        </a>
      </div>
    </main>
  );
}
