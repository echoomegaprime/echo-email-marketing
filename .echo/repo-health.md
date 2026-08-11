# Repository health receipt

**Repo:** `echoomegaprime/echo-email-marketing`
**Commit:** `a3490157db9788e8db483f9217055a1d4c5ed9c8`
**Date:** 2026-08-11

The ECHO GitHub App Suite's automated check-run delivery did not post to this commit
(`gh api repos/echoomegaprime/echo-email-marketing/commits/a3490157db9788e8db483f9217055a1d4c5ed9c8/check-runs`
returns `total_count: 0`) — a recurring App-side failure (#29466) seen on every repo in this
consolidation campaign. This document is the manual replacement health receipt.

## 7-point showroom-floor audit

1. **README.md** — present, describes purpose, endpoints, auth model, verify steps. ✅
2. **LICENSE** — present. ✅
3. **SECURITY.md** — present, documents the unauthenticated-PII fix, the `/plans` split, and
   dependency bumps in detail. ✅
4. **CONTRIBUTING.md** — present, calls out the auth-allowlist regression risk explicitly. ✅
5. **CHANGELOG.md** — present, dated entry for this consolidation pass. ✅
6. **CODE_OF_CONDUCT.md** — present (written fresh for this repo, not copy-pasted from an
   unrelated sibling repo's boilerplate). ✅
7. **CI** (`.github/workflows/ci.yml`, job `echo-email-marketing-ci`) — runs `npm install`,
   `npx tsc --noEmit`, `node --test tests/*.test.mjs` on push/PR to `main`. ✅

## Secret-literal scan

`grep -rEn '(api_key|secret|password|token)\s*=\s*["\x27][a-zA-Z0-9_-]{16,}["\x27]'` across all
tracked `.ts`/`.json`/`.sql`/`.toml` files: **zero matches.**

## Tracked-file listing (`git ls-tree -r --name-only HEAD`)

```
.echo/apps.json
.echo/certification.json
.echo/sdk.json
.github/ISSUE_TEMPLATE/bug_report.yml
.github/ISSUE_TEMPLATE/config.yml
.github/ISSUE_TEMPLATE/feature_request.yml
.github/PULL_REQUEST_TEMPLATE.md
.github/workflows/ci.yml
.gitignore
CHANGELOG.md
CODE_OF_CONDUCT.md
CONTRIBUTING.md
LICENSE
README.md
SECURITY.md
package-lock.json
package.json
scripts/certforge_journey.py
src/index.ts
src/schema.sql
tests/auth.test.mjs
tsconfig.json
wrangler.toml
```

No `node_modules/`, no `.env`, no build output, no Python bytecode cache committed.

## Fixes applied this consolidation pass (see SECURITY.md and CHANGELOG.md for detail)

- **Unauthenticated PII disclosure**: the auth middleware exempted every GET request from
  authentication regardless of an explicit public-path allowlist, letting anyone dump every
  contact's email/phone/company for any tenant via `GET /contacts?tenant_id=<id>`. Removed the
  blanket GET exemption; added a narrow, evidence-based carve-out for the pre-existing
  public-catalog-vs-tenant-billing split in `GET /plans`.
- Constant-time `timingSafeEqual` for the API key comparison (was raw `!==`).
- `hono` `4.4.0` → `4.13.1` (production runtime dependency, 28 advisories, not dev tooling).
  `npm audit`: 0 vulnerabilities.

## Regression proof

Both real fixes verified individually discriminating via commit-first tamper/restore:
reintroducing the blanket GET exemption fails 8 of 17 `tests/auth.test.mjs` tests; reverting
`timingSafeEqual` to a raw comparison produces **zero** test failures (expected — functional
tests cannot distinguish timing-safe from raw comparison), so `scripts/certforge_journey.py`'s
text-anchored `check_constant_time_auth` is the only regression guard for that specific fix.
Both journey checks independently confirmed to fail under the same tamper conditions.

## Cert Forge

Submitted `cert_65fc266b51d669d711d069b6d014ebb91106e494` against this commit under
`certforge.release-strict.v2`. Signed verdict: `release_verdict: PRODUCTION_READY`,
`reasons: [all_mandatory_rules_verified]` — PRODUCTION_READY on the first submission.

Filed by the autonomous GitHub Certified Consolidation process per `CLAUDE.md`.
