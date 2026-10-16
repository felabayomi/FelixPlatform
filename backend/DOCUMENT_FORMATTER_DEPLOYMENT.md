# Dedicated Document Formatter backend

Local candidate only. No service creation, publishing, or environment changes are authorized.

## Service configuration proposed for later approval

- Root: `backend`
- Build: `npm ci`
- Start: `node documentFormatterServer.js`
- Runtime: supported Node 24 release; validate a clean Linux installation first.
- Health: `/api/health` (process health, not database/email readiness)
- Auto-deploy: off initially; use an approved dedicated release branch.

Do not start `server.js` or synchronize `backend/render.yaml`: that blueprint names
the existing shared service and is not a dedicated Formatter blueprint.

Required service configuration: `NODE_ENV=production`, `DATABASE_URL`, a distinct
random `SECRET_KEY` of at least 32 bytes, and exact comma-separated
`ALLOWED_ORIGINS` including `https://formatter.felixplatforms.com`.
Access-request delivery also needs `RESEND_API_KEY`, verified `RESEND_FROM_EMAIL`,
and explicit `SUPPORT_NOTIFICATION_EMAIL`. Do not supply unrelated service secrets.
The key length check does not prove entropy. Provision the key privately.

Only login, me, formatter health/overview, access requests, and document operations
are exposed. No registration, reset-password, demonstration auth, billing,
schedulers, or unrelated routers are mounted. Formatter table initialization is
disabled by a server-side request flag, including multipart callbacks.

## Entitlement limitation

Repository evidence establishes `subscriptions.user_id`, `status`, and `end_date`,
but does not establish an authoritative Formatter product ID or a subscription
product mapping. Product catalog fields and the marketing slug `document-formatter`
are not sufficient evidence. The dedicated service therefore grants document
operations only to existing admin/superadmin accounts. Other users can authenticate
but receive `document_formatter_access: false` and HTTP 403 on document operations,
even if subscribed to another product. No user/subscription writes are performed.
Shared backend requests retain their previous entitlement behavior.

Before enabling paid users, obtain read-only schema/foreign-key metadata for the
subscription product relationship and an authoritative catalog identifier from
the owner. Add the scoped query and tests only after that evidence is approved.

## Validation

Run `npm ci`, then `npm test` in an isolated environment with synthetic fixtures.
Tests substitute the database and email adapters before importing the app.
The real bcrypt, JWT, formatter generators, router and upload handling are used.
Linux/native bcrypt and actual database/email/browser integration remain separate
release gates. A missing signing key or invalid CORS configuration prevents startup.

## Publication safety

The existing Render service's linked branch, build filters, auto-deploy settings,
deploy hooks and Blueprint association cannot be established from this checkout.
Confirm these read-only before any push, PR, merge, or Blueprint operation.
Do not use the platform release/deploy scripts for this isolated service.
Keep `admin-dashboard/server.js` unchanged and do not deploy the shared service.
Even backend-only merges could trigger it if its actual configuration differs
from the supplied root directory or has other automation.

After separate approval, publish a reviewed dedicated branch without triggering
the shared service, validate a new isolated backend, and change only Formatter's
frontend `VITE_API_URL`. Replace its shared-backend fallback as part of frontend
cutover and require a fresh Formatter login.

Record known-good dedicated service commits and frontend artifacts. Redeploy a
recorded dedicated commit if artifact rollback is unavailable. First-cutover
rollback restores the previous frontend or maintenance state, not a working old
Formatter backend. Never roll back the shared service or delete formatter data.
