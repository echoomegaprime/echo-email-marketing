# Changelog

## Unreleased -- consolidation pass (2026-08-11)

### Security
- **Fixed unauthenticated PII disclosure**: the auth middleware exempted every GET request from
  authentication regardless of its own explicit public-path allowlist, letting anyone dump every
  contact's email/phone/company for any tenant via `GET /contacts?tenant_id=<id>` with no
  credentials. Removed the blanket GET exemption.
- Added a narrow `GET /plans` carve-out matching the handler's existing public-catalog-vs-tenant
  -billing split, rather than reintroducing a blanket exemption.
- Constant-time `timingSafeEqual` for the API key comparison in `authOk()` (was raw `!==`).

### Fixed
- `hono` `4.4.0` -> `4.13.1` (28 advisories on the pinned range; production runtime dependency).
- `@cloudflare/workers-types` `^4.20240620.0` -> `^5.0.0`, `wrangler` `^3.60.0` -> `^4.77.0`,
  `typescript` `^5.5.0` -> `^6.0.2`. `npm audit`: 0 vulnerabilities.
- `package.json` gained a real `test` script.

### Added
- `tests/auth.test.mjs` -- 17 tests covering every public route, the fixed auth gate on both
  credential paths, the `/plans` public-vs-protected split, fail-closed with no key configured,
  and a same-length-vs-different-length wrong-key timing-shape check.
- Full governance set (README, SECURITY, CONTRIBUTING, CODE_OF_CONDUCT, LICENSE, CI).

## 1.0.0 -- original release

Multi-tenant email marketing platform: contacts, lists, templates, campaigns, A/B testing,
automations, tracking, Stripe billing, AI-assisted subject/content generation.
