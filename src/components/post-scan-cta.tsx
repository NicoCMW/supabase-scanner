interface PostScanCtaProps {
  readonly totalFindings: number;
}

export function PostScanCta({ totalFindings }: PostScanCtaProps) {
  if (totalFindings === 0) return null;

  return (
    <div className="w-full max-w-3xl p-5 bg-amber-50 border border-amber-200 rounded-xl mt-6">
      <p className="text-sm font-medium text-amber-900 mb-1">
        Found {totalFindings} security issue{totalFindings !== 1 ? "s" : ""}
      </p>
      <p className="text-sm text-amber-700 mb-4">
        Upgrade to Pro for unlimited scans, scheduled monitoring, and fix
        tracking so nothing slips through the cracks.
      </p>
      <a
        href="/pricing"
        className="inline-block px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Upgrade to Pro
      </a>
    </div>
  );
}
