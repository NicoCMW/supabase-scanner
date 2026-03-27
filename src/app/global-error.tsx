"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="antialiased bg-sand-50 text-sand-900 min-h-screen font-sans flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-sand-500">
            An unexpected error occurred. Our team has been notified.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
