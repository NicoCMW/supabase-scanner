# SupaScanner GitHub Action

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-SupaScanner-green?logo=github)](https://github.com/marketplace/actions/supascanner-security-scan)

A GitHub Action that runs Supabase security scans on pull requests and pushes, posting results as PR comments.

> For local scanning and other CI/CD systems, use the [supascanner CLI](https://www.npmjs.com/package/supascanner): `npx supascanner scan`

## Usage

Add the following workflow to your repository at `.github/workflows/security-scan.yml`:

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

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `supabase-url` | Yes | - | Your Supabase project URL |
| `supabase-anon-key` | Yes | - | Your Supabase anon/public key |
| `threshold` | No | `high` | Fail severity threshold: `critical`, `high`, or `medium` |
| `comment-on-pr` | No | `true` | Post scan results as a PR comment |
| `github-token` | No | `${{ github.token }}` | GitHub token for PR comments |

## Outputs

| Output | Description |
|--------|-------------|
| `grade` | Overall security grade (A through F) |
| `total-findings` | Total number of security findings |
| `critical-count` | Number of critical severity findings |
| `high-count` | Number of high severity findings |
| `threshold-exceeded` | Whether the configured threshold was exceeded (`true`/`false`) |

## How It Works

1. The action installs the SupaScanner packages and runs a security scan against your Supabase project
2. It checks RLS policies, storage bucket permissions, and auth configuration
3. Results are graded A through F based on finding severity
4. On pull requests, a comment is posted (or updated) with the full report
5. If findings meet or exceed the configured `threshold`, the action fails the workflow

## Secrets Setup

Add these secrets to your repository (Settings > Secrets and variables > Actions):

- `SUPABASE_URL` - Your Supabase project URL (e.g., `https://abc123.supabase.co`)
- `SUPABASE_ANON_KEY` - Your Supabase anon/public key

## Threshold Behavior

The `threshold` input controls when the action exits with a non-zero code:

| Threshold | Fails on |
|-----------|----------|
| `critical` | Critical findings only |
| `high` | Critical or high findings |
| `medium` | Critical, high, or medium findings |

If no threshold is set, the action always succeeds (findings are reported but do not block the pipeline).

## PR Comment

When `comment-on-pr` is `true` and the trigger is a pull request, the action posts a markdown comment with:

- Security grade
- Finding counts by severity
- Detailed findings in a collapsible section

The comment is updated on subsequent runs rather than creating duplicates.

## Example: Conditional Steps

Use the outputs to conditionally run other steps:

```yaml
- name: Run SupaScanner
  id: scan
  uses: NicoCMW/supabase-scanner@v1
  with:
    supabase-url: ${{ secrets.SUPABASE_URL }}
    supabase-anon-key: ${{ secrets.SUPABASE_ANON_KEY }}
    threshold: "critical"

- name: Notify on poor grade
  if: steps.scan.outputs.grade == 'F'
  run: echo "Security grade is F - review required"
```
