# Echo Email Marketing

Multi-tenant email marketing platform on Cloudflare Workers -- contacts, lists, templates,
campaigns, A/B testing, automations, open/click tracking, and AI-assisted subject/content
generation. Depends on the separate `echo-email-sender` Worker (service binding `EMAIL_SENDER`)
for actual delivery.

## Endpoints

| Access | Method | Path | Description |
|---|---|---|---|
| Public | GET | `/`, `/health`, `/status` | Health |
| Public | POST | `/subscribe` | Website signup form target |
| Public | GET | `/track/open/:campaignId/:contactId`, `/track/click/:campaignId/:contactId` | Pixel/link tracking |
| Public | GET | `/unsubscribe/:contactId` | One-click unsubscribe |
| Public | POST | `/webhooks/stripe` | Stripe webhook (signature-verified) |
| Public | GET | `/plans` (no tenant identifier) | Pricing catalog |
| Authenticated | GET | `/plans?tenant_id=...` | Tenant-specific plan/billing status |
| Authenticated | everything else | Tenant/contact/list/template/campaign/automation management, analytics, AI generation |

## Authentication

Every route other than the public list above requires `X-Echo-API-Key` (or `Authorization:
Bearer`), compared to `env.ECHO_API_KEY` in constant time -- **including management GET
routes**. This repo previously had a real bug exempting every GET from auth regardless of the
public-path allowlist, letting anyone dump every contact's email/phone/company for any tenant
via `GET /contacts?tenant_id=<id>` with no credentials. See [SECURITY.md](SECURITY.md).

## Verify

```powershell
npm install
npm test
```

## Security

See [SECURITY.md](SECURITY.md) to report a vulnerability -- never as a public issue.

## License

See [LICENSE](LICENSE). Contributions: see [CONTRIBUTING.md](CONTRIBUTING.md).
