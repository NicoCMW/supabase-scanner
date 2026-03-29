# SupaScanner

**Find security misconfigurations in your Supabase project before attackers do.**

[![npm version](https://img.shields.io/npm/v/supascanner?color=cb3837&logo=npm)](https://www.npmjs.com/package/supascanner)
[![GitHub Action](https://img.shields.io/badge/GitHub%20Action-SupaScanner-green?logo=github)](https://github.com/marketplace/actions/supascanner-security-scan)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

SupaScanner audits your Supabase project's Row Level Security policies, storage bucket permissions, and auth configuration. Run it from the CLI, your CI pipeline, or the web dashboard -- get a security grade (A-F) and actionable remediation steps.

---

## Quick Start

### Web App

Scan any Supabase project instantly at **[supascanner.com](https://supascanner.com)**. No install required.

### CLI

```bash
npx supascanner scan --url https://abc123.supabase.co --key your-anon-key
```

Or with environment variables:

```bash
export SUPABASE_URL=https://abc123.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
npx supascanner scan
```

### GitHub Action

Add to `.github/workflows/security-scan.yml`:

```yaml
name: Supabase Security Scan

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read
  pull-requests: write

jobs:
  scan:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run SupaScanner
        id: scan
        uses: NicoCMW/supabase-scanner@v1
        with:
          supabase-url: ${{ secrets.SUPABASE_URL }}
          supabase-anon-key: ${{ secrets.SUPABASE_ANON_KEY }}
          threshold: "high"
```

The action posts scan results as a PR comment and fails the workflow if findings meet or exceed the threshold.

---

## What It Checks

SupaScanner runs **13 security checks** across three modules:

### Row Level Security (RLS)

| Check | Severity |
|-------|----------|
| Tables publicly readable with data exposed | Critical |
| Tables accessible but empty (RLS likely disabled) | High |
| Tables allowing anonymous INSERT | Critical |

### Storage Buckets

| Check | Severity |
|-------|----------|
| Buckets allowing anonymous file uploads | Critical |
| Buckets with permissive upload policies | High |
| Bucket contents enumerable (with objects) | High |
| Bucket contents enumerable (empty) | Medium |
| Buckets marked as public | Medium |

### Authentication

| Check | Severity |
|-------|----------|
| Email confirmation disabled (instant signup) | High |
| User enumeration possible via auth responses | Medium |
| Auth configuration publicly readable | Low |

Every finding includes a description, severity rating, and SQL/config remediation steps.

---

## Security Grades

Findings are scored by severity, and the total determines the grade:

| Grade | Score Range | Meaning |
|-------|------------|---------|
| **A** | 0-4 | Minimal exposure |
| **B** | 5-9 | Low risk, minor issues |
| **C** | 10-19 | Moderate risk, action needed |
| **D** | 20-29 | High risk, fix promptly |
| **F** | 30+ | Critical exposure |

Scoring: Critical = 10 pts, High = 7 pts, Medium = 4 pts, Low = 1 pt.

---

## CLI Reference

```
supascanner scan [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--url <url>` | Supabase project URL | `$SUPABASE_URL` |
| `--key <key>` | Supabase anon key | `$SUPABASE_ANON_KEY` |
| `--format <fmt>` | Output format: `table`, `json`, `markdown` | `table` |
| `--threshold <level>` | Fail if findings at/above: `critical`, `high`, `medium` | none |

**Config file:** Place a `.supascanner.config.json` in your project root:

```json
{
  "url": "https://abc123.supabase.co",
  "anonKey": "your-anon-key",
  "format": "table",
  "threshold": "high"
}
```

Priority: CLI flags > config file > environment variables.

**Exit codes:** `0` = clean scan, `1` = threshold exceeded, `2` = error.

---

## GitHub Action Reference

See the full [Action documentation](ACTION_README.md) for inputs, outputs, and advanced usage.

**Inputs:**

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `supabase-url` | Yes | -- | Supabase project URL |
| `supabase-anon-key` | Yes | -- | Supabase anon key |
| `threshold` | No | `high` | Fail severity: `critical`, `high`, `medium` |
| `comment-on-pr` | No | `true` | Post results as PR comment |

**Outputs:** `grade`, `total-findings`, `critical-count`, `high-count`, `threshold-exceeded`

---

## Example Output

```
 SupaScanner Security Report
 Grade: C  |  Findings: 4  |  Duration: 620ms

 CRITICAL  Table "users" is publicly readable with data exposed
           Resource: public.users
           Fix: ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

 HIGH      Storage bucket "avatars" is listable
           Resource: avatars (12 objects)
           Fix: Restrict SELECT policy on storage.objects for this bucket

 HIGH      Email confirmation is disabled
           Resource: auth
           Fix: Enable email confirmations in Dashboard > Authentication > Settings

 MEDIUM    Auth configuration is publicly readable
           Resource: auth
           Note: Expected behavior, but reveals enabled providers
```

---

## Pricing

| | Free | Pro |
|---|---|---|
| Web scans | 3/month | Unlimited |
| CLI | Unlimited | Unlimited |
| GitHub Action | Unlimited | Unlimited |
| Scheduled scans | -- | Included |
| Team dashboard | -- | Included |
| **Price** | $0 | $29/month |

Start at [supascanner.com](https://supascanner.com).

---

## Contributing

Contributions are welcome. The project is a monorepo with three packages:

```
packages/
  scanner-core/   # @supascanner/core - scanning engine
  cli/            # supascanner - CLI tool
src/              # Next.js web app
action/           # GitHub Action wrapper
```

```bash
git clone https://github.com/NicoCMW/supabase-scanner.git
cd supabase-scanner
npm install
npm run dev          # Start the web app
npm run test         # Run tests
```

---

## License

[MIT](LICENSE)
