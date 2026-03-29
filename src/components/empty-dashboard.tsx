export function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center text-center py-20 px-4">
      <div className="w-16 h-16 mb-6 rounded-2xl bg-sand-100 border border-sand-200 flex items-center justify-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-sand-400"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-sand-900 mb-2">
        No scans yet
      </h2>
      <p className="text-sm text-sand-400 mb-6 max-w-sm">
        Enter your Supabase project URL to find security issues in your RLS
        policies, storage rules, and auth configuration.
      </p>
      <a
        href="/scan"
        className="px-5 py-2.5 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Run your first scan
      </a>
      <div className="mt-10 flex items-start gap-6 text-left max-w-md">
        <Step number={1} text="Paste your Supabase project URL and anon key" />
        <Step number={2} text="We scan RLS, storage, and auth in under 60s" />
        <Step number={3} text="Get a security grade and actionable fixes" />
      </div>
    </div>
  );
}

function Step({
  number,
  text,
}: {
  readonly number: number;
  readonly text: string;
}) {
  return (
    <div className="flex-1">
      <div className="w-7 h-7 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center text-xs font-semibold text-sand-600 mb-2">
        {number}
      </div>
      <p className="text-xs text-sand-500 leading-relaxed">{text}</p>
    </div>
  );
}
