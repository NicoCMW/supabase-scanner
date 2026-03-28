"use client";

interface DocLink {
  readonly href: string;
  readonly label: string;
}

interface DocsNavProps {
  readonly currentPath: string;
}

const docLinks: readonly DocLink[] = [
  { href: "/docs", label: "Quick Start" },
  { href: "/docs/cli", label: "CLI" },
  { href: "/docs/api", label: "API Reference" },
];

export function DocsNav({ currentPath }: DocsNavProps) {
  return (
    <nav aria-label="Documentation" className="mb-10 md:mb-0 md:w-48 shrink-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-sand-400 mb-3">
        Documentation
      </p>
      <ul className="space-y-1">
        {docLinks.map((link) => {
          const isActive = currentPath === link.href;
          return (
            <li key={link.href}>
              <a
                href={link.href}
                className={`block py-1.5 px-3 text-sm rounded-md transition-colors ${
                  isActive
                    ? "bg-sand-100 text-sand-900 font-medium"
                    : "text-sand-500 hover:text-sand-900 hover:bg-sand-100"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
