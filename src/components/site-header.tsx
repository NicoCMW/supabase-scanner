"use client";

import { useState } from "react";

interface NavLink {
  readonly href: string;
  readonly label: string;
}

interface SiteHeaderProps {
  readonly links?: readonly NavLink[];
}

const defaultLinks: readonly NavLink[] = [
  { href: "/docs", label: "Docs" },
  { href: "/security-checklist", label: "Checklist" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader({ links = defaultLinks }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="flex items-center justify-between px-8 py-5 max-w-5xl mx-auto relative">
      <a
        href="/"
        className="text-base font-semibold tracking-tight text-sand-900"
      >
        SupaScanner
      </a>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center gap-6">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-sm text-sand-500 hover:text-sand-900 transition-colors"
          >
            {link.label}
          </a>
        ))}
        <a
          href="/login"
          className="text-sm px-4 py-2 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors"
        >
          Sign in
        </a>
      </div>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="md:hidden flex items-center justify-center w-11 h-11 rounded-lg text-sand-700 hover:bg-sand-100 transition-colors"
        onClick={() => setMenuOpen((prev) => !prev)}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
      >
        {menuOpen ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        )}
      </button>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-sand-200 shadow-sm md:hidden z-50">
          <div className="flex flex-col px-8 py-4 gap-1">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-3 text-sm text-sand-500 hover:text-sand-900 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/login"
              className="block mt-2 text-center py-2.5 bg-sand-900 hover:bg-sand-700 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Sign in
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
