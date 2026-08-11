# Security policy

Echo Email Marketing is a multi-tenant Cloudflare Worker (D1 + KV + Analytics Engine) running a
contact/campaign management API plus public signup, tracking, and unsubscribe endpoints.

## Fixed in this consolidation pass

1. **Unauthenticated PII disclosure (the primary finding).** The global auth middleware checked
   an explicit, carefully-scoped public-path allowlist (`/health`, `/status`, `/subscribe`,
   `/track/*`, `/unsubscribe/*`, `/webhooks/stripe`) and then, immediately after, exempted
   **every GET request regardless of path**: `if (c.req.method === 'GET') return next();`. The
   existence of the precise allowlist right above that blanket exemption is strong evidence the
   GET exemption was an oversight, not a parallel design choice -- the same bug class already
   found and fixed in `echo-lms` and `echo-document-manager` earlier in this consolidation
   campaign. In practice this meant `GET /contacts?tenant_id=<any-tenant-id>` returned every
   contact's email, phone, and company for that tenant with **zero authentication** -- and the
   same applied to `GET /tenants/:id` (full tenant record), `GET /lists/:lid/contacts`, `GET
   /campaigns`, `GET /templates`, and `GET /analytics/*` (business metrics). Removed the blanket
   GET exemption entirely.
2. **`GET /plans` public/private split.** The `/plans` handler itself already branched: no
   tenant identifier returns the public pricing catalog, a tenant identifier returns
   tenant-specific billing status including `stripe_customer_id`. The auth middleware now
   carries a narrow, precise carve-out matching that existing split -- `GET /plans` with no
   `tenant_id`/`X-Tenant-ID` stays public; `GET /plans?tenant_id=...` requires auth like every
   other tenant-scoped route.
3. **Timing side-channel in the credential check.** The API key comparison used a raw `!==`.
   Replaced with a constant-time `timingSafeEqual`. The Stripe webhook signature verification
   (`verifyStripeSignature`) was already implemented with a manual constant-time XOR-accumulate
   loop and is unchanged.
4. **Dependency hygiene.** `hono` bumped `4.4.0` (resolved `4.12.9`) -> `4.13.1` via `npm audit
   fix` -- 28 advisories affecting the pinned range, and `hono` is this Worker's actual
   production runtime framework, not dev tooling, so this was fixed rather than documented and
   deferred. `@cloudflare/workers-types` `^4.20240620.0` -> `^5.0.0`, `wrangler` `^3.60.0` ->
   `^4.77.0`, `typescript` `^5.5.0` -> `^6.0.2`. `npm audit` now reports 0 vulnerabilities.

## Regression coverage

The blanket-GET fix and the `/plans` carve-out are both verified by `tests/auth.test.mjs`
(commit-first tamper/restore: reintroducing `if (c.req.method === 'GET') return next();`
produces 8 failing tests). The timing-safe fix is **not** functionally discriminable --
reverting `timingSafeEqual` to a raw `!==` produces zero test failures, since both return the
same true/false for a wrong key -- so `scripts/certforge_journey.py`'s text-pattern check is the
only regression guard for that specific fix.

## Supported version

Security fixes target the current `main` branch. Historical commits are retained for evidence
and are not patched in place.

## Report a vulnerability

Do not open a public issue for a suspected vulnerability. Send a private report to
`security@echo-op.com` with:

- affected endpoint and exact revision;
- reproduction steps and expected impact;
- safe contact details for follow-up.

Never include a live `ECHO_API_KEY` or Stripe secret in a report.
