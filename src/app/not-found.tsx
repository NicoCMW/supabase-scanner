import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 max-w-5xl mx-auto w-full">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-sand-900"
        >
          SupaScanner
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-8">
        <div className="text-center space-y-4">
          <p className="text-sm text-sand-400 tracking-wide uppercase">404</p>
          <h1 className="text-2xl font-semibold text-sand-900">
            Page not found
          </h1>
          <p className="text-sm text-sand-500 max-w-md">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="inline-block px-7 py-2.5 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
