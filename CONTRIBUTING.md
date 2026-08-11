# Contributing

Thank you for improving Echo Email Marketing. This is a public, proprietary infrastructure
project: contributions are welcome for review, but repository visibility does not grant a
general use or redistribution license.

## Development path

1. Open an issue describing the behavior being changed.
2. Create a focused branch from current `main`.
3. Add a failing test before changing the auth middleware, `timingSafeEqual`, or the
   `/plans` public/private split -- see SECURITY.md for exactly what's public by design versus
   authenticated-only.
4. Validate before opening a pull request:

   ```powershell
   npm install
   npm test
   ```

5. Open a pull request using the repository template and include exact test output.

## Pull-request requirements

- No secrets (`ECHO_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`) are included.
- No stubs, placeholders, or self-asserted readiness.
- **Any change to the auth middleware's public-path allowlist must be called out explicitly in
  the pull request description** -- this repo previously shipped a blanket GET-method exemption
  that leaked contact PII for every tenant with no authentication; a change that reintroduces a
  method-based (rather than path-based) exemption would be a real regression.
