# supascanner CLI

Command-line tool for scanning Supabase projects for security vulnerabilities. Checks Row-Level Security (RLS), storage bucket policies, and authentication configuration.

## Installation

```bash
npm install -g supascanner
```

Or run directly with npx:

```bash
npx supascanner scan --url <supabase-url> --key <anon-key>
```

## Usage

```bash
supascanner scan --url https://your-project.supabase.co --key eyJhbG...
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--url <url>` | Supabase project URL | `$SUPABASE_URL` |
| `--key <key>` | Supabase anon key | `$SUPABASE_ANON_KEY` |
| `--format <format>` | Output format: `json`, `table`, or `markdown` | `table` |
| `--threshold <level>` | Fail (exit 1) on findings at this severity or above: `critical`, `high`, or `medium` | none |

### Environment Variables

Set these to avoid passing credentials every time:

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=eyJhbG...
supascanner scan
```

### Project Configuration

Create a `.supascanner.config.json` in your project root:

```json
{
  "url": "https://your-project.supabase.co",
  "anonKey": "eyJhbG...",
  "format": "table",
  "threshold": "high"
}
```

Priority order: CLI flags > config file > environment variables.

## Output Formats

### Table (default)

Human-readable colored output for terminal use:

```bash
supascanner scan --format table
```

### JSON

Machine-readable JSON for programmatic consumption:

```bash
supascanner scan --format json
```

### Markdown

Markdown report suitable for documentation or PR comments:

```bash
supascanner scan --format markdown > report.md
```

## CI/CD Integration

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Scan completed, no findings above threshold |
| 1 | Findings at or above threshold severity |
| 2 | Error (invalid input, network failure) |

### GitHub Actions

```yaml
name: Supabase Security Scan
on:
  push:
    branches: [main]
  pull_request:

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Supabase security scan
        run: npx supascanner scan --threshold high --format table
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### GitLab CI

```yaml
supabase-security-scan:
  image: node:20
  stage: test
  script:
    - npx supascanner scan --threshold high --format table
  variables:
    SUPABASE_URL: $SUPABASE_URL
    SUPABASE_ANON_KEY: $SUPABASE_ANON_KEY
  only:
    - main
    - merge_requests
```

### Generate Markdown Report as PR Comment

```yaml
name: Security Report
on: pull_request

jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run scan
        id: scan
        run: |
          npx supascanner scan --format markdown > scan-report.md
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

      - name: Comment PR
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          path: scan-report.md
```

## What Gets Scanned

### RLS Audit
- Tables accessible without authentication
- Tables allowing anonymous INSERT operations
- OpenAPI schema enumeration

### Storage Audit
- Publicly listable storage buckets
- Buckets allowing anonymous file uploads
- Public bucket flag review

### Auth Audit
- Email confirmation configuration
- User enumeration via signup/recovery endpoints
- Publicly exposed auth settings
