"use client";

import { useState, useRef, useEffect } from "react";

interface SearchEntry {
  readonly title: string;
  readonly href: string;
  readonly section: string;
  readonly keywords: string;
}

const searchIndex: readonly SearchEntry[] = [
  {
    title: "Quick Start",
    href: "/docs",
    section: "Getting Started",
    keywords:
      "quick start getting started sign up account scan first run supabase url anon key dashboard findings grade severity remediation fix",
  },
  {
    title: "CLI Installation",
    href: "/docs/cli",
    section: "CLI",
    keywords:
      "install npm npx supascanner cli terminal command line node global",
  },
  {
    title: "CLI Options",
    href: "/docs/cli",
    section: "CLI",
    keywords:
      "url key format table json markdown threshold critical high medium flags options arguments",
  },
  {
    title: "CLI Configuration File",
    href: "/docs/cli",
    section: "CLI",
    keywords:
      "config configuration file .supascanner.config.json environment variables SUPABASE_URL SUPABASE_ANON_KEY",
  },
  {
    title: "CLI Exit Codes",
    href: "/docs/cli",
    section: "CLI",
    keywords: "exit code 0 1 2 error threshold ci cd pipeline gate deploy",
  },
  {
    title: "GitHub Action Setup",
    href: "/docs/github-action",
    section: "GitHub Action",
    keywords:
      "github action workflow yml yaml ci cd automation pull request push setup secrets",
  },
  {
    title: "GitHub Action Inputs",
    href: "/docs/github-action",
    section: "GitHub Action",
    keywords:
      "supabase-url supabase-anon-key threshold comment-on-pr github-token inputs required",
  },
  {
    title: "GitHub Action Outputs",
    href: "/docs/github-action",
    section: "GitHub Action",
    keywords:
      "grade total-findings critical-count high-count threshold-exceeded report-markdown outputs steps",
  },
  {
    title: "PR Comments",
    href: "/docs/github-action",
    section: "GitHub Action",
    keywords:
      "pull request comment pr report markdown idempotent update permissions",
  },
  {
    title: "Threshold Gating",
    href: "/docs/github-action",
    section: "GitHub Action",
    keywords:
      "threshold gate block merge fail critical high medium branch protection",
  },
  {
    title: "Scheduled Scans",
    href: "/docs/github-action",
    section: "GitHub Action",
    keywords: "schedule cron weekly daily trigger recurring automated",
  },
  {
    title: "API Authentication",
    href: "/docs/api",
    section: "API Reference",
    keywords:
      "auth authentication bearer token session cookie authorization header server",
  },
  {
    title: "POST /api/scan",
    href: "/docs/api",
    section: "API Reference",
    keywords:
      "scan endpoint submit run supabaseUrl anonKey request response findings modules grade",
  },
  {
    title: "Rate Limits and Quotas",
    href: "/docs/api",
    section: "API Reference",
    keywords: "rate limit quota usage plan free pro 429 scans month",
  },
  {
    title: "POST /api/share",
    href: "/docs/api",
    section: "API Reference",
    keywords: "share shareable link public results scan job id url",
  },
  {
    title: "GET /api/billing/usage",
    href: "/docs/api",
    section: "API Reference",
    keywords: "billing usage quota plan scans period free pro",
  },
  {
    title: "GET /api/health",
    href: "/docs/api",
    section: "API Reference",
    keywords: "health check status database uptime monitoring",
  },
  {
    title: "Scanner Core Installation",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords:
      "install npm @supascanner/core library package esm node typescript",
  },
  {
    title: "runScan()",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords:
      "runScan function scan target modules result grade findings programmatic",
  },
  {
    title: "validateTarget()",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords: "validate target url anon key errors valid invalid",
  },
  {
    title: "computeGrade()",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords: "compute grade findings severity points score letter",
  },
  {
    title: "RLS Audit Module",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords:
      "rls row level security audit module tables public readable anonymous insert select",
  },
  {
    title: "Storage Audit Module",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords:
      "storage audit module bucket upload listable public anonymous files objects",
  },
  {
    title: "Auth Audit Module",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords:
      "auth audit module email confirmation user enumeration settings providers",
  },
  {
    title: "Auth Security Module",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords:
      "auth security module password policy mfa multi-factor jwt expiry oauth rate limiting",
  },
  {
    title: "Grading System",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords: "grade grading system points severity A B C D F score",
  },
  {
    title: "TypeScript Types",
    href: "/docs/scanner-core",
    section: "Scanner Core",
    keywords:
      "types typescript ScanTarget ScanResult Finding Severity Grade interface",
  },
  {
    title: "Badge Setup",
    href: "/docs/badge",
    section: "Badge",
    keywords:
      "badge svg embed readme markdown html security grade shield image",
  },
  {
    title: "Badge Customization",
    href: "/docs/badge",
    section: "Badge",
    keywords: "badge style flat flat-square label custom query parameter",
  },
  {
    title: "Share ID",
    href: "/docs/badge",
    section: "Badge",
    keywords: "share id project id badge url scan result public",
  },
];

export function DocsSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results =
    query.length < 2
      ? []
      : searchIndex.filter((entry) => {
          const q = query.toLowerCase();
          return (
            entry.title.toLowerCase().includes(q) ||
            entry.keywords.includes(q) ||
            entry.section.toLowerCase().includes(q)
          );
        });

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }

    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative mb-8">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sand-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search docs..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 pr-16 py-2.5 text-sm border border-sand-200 rounded-lg bg-white text-sand-900 placeholder:text-sand-400 focus:outline-none focus:border-sand-400 transition-colors"
          aria-label="Search documentation"
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
        />
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-sand-400 border border-sand-200 rounded">
          <span className="text-xs">Ctrl</span>K
        </kbd>
      </div>

      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-sand-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-sand-400">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <ul role="listbox">
              {results.map((entry, i) => (
                <li key={`${entry.href}-${i}`}>
                  <a
                    href={entry.href}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-sand-50 transition-colors border-b border-sand-100 last:border-b-0"
                    onClick={() => setIsOpen(false)}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-sand-900 truncate">
                        {entry.title}
                      </p>
                      <p className="text-xs text-sand-400">{entry.section}</p>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
